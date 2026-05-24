import { supabaseAdmin } from '../../config/supabase'
import { mpesaService } from '../../services/mpesa.service'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'
import { paymentQueue } from '../../jobs/queue'
import { notFound, unprocessable, conflict } from '../../utils/errors'

const UNLOCK_PRICE_KSH = 100

export async function unlockListing(listingId: string, tenantUserId: string) {
  // 1. Check if tenant already unlocked
  const { data: existingInquiry } = await supabaseAdmin
    .from('inquiries')
    .select('id, unlocked_at, listing_id')
    .eq('tenant_user_id', tenantUserId)
    .eq('listing_id', listingId)
    .not('unlocked_at', 'is', null)
    .maybeSingle()

  if (existingInquiry) {
    const contactDetails = await getContactDetails(listingId)
    return { status: 'already_unlocked', contact_details: contactDetails }
  }

  // Verify listing exists and is available
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('id, estate, lister_user_id, status')
    .eq('id', listingId)
    .single()

  if (!listing) throw notFound('Listing not found')
  if (listing.status !== 'available') throw conflict('This listing is no longer available')

  // Get tenant profile
  const { data: tenantProfile } = await supabaseAdmin
    .from('tenant_profiles')
    .select('free_credits, is_subscribed, subscription_expires_at')
    .eq('user_id', tenantUserId)
    .single()

  if (!tenantProfile) throw notFound('Tenant profile not found')

  // 2. Check subscription
  const subscriptionActive =
    tenantProfile.is_subscribed &&
    tenantProfile.subscription_expires_at &&
    new Date(tenantProfile.subscription_expires_at) > new Date()

  if (subscriptionActive) {
    const inquiry = await createUnlockedInquiry(listingId, tenantUserId, null)
    const contactDetails = await getContactDetails(listingId)
    await notifyLister(listing.lister_user_id, listing.estate)
    return { status: 'unlocked', contact_details: contactDetails, inquiry_id: inquiry.id }
  }

  // 3. Check free credits
  if ((tenantProfile.free_credits ?? 0) > 0) {
    // Deduct one credit
    await supabaseAdmin
      .from('tenant_profiles')
      .update({ free_credits: tenantProfile.free_credits - 1 })
      .eq('user_id', tenantUserId)

    const inquiry = await createUnlockedInquiry(listingId, tenantUserId, null)
    const contactDetails = await getContactDetails(listingId)
    await notifyLister(listing.lister_user_id, listing.estate)

    return {
      status: 'unlocked',
      contact_details: contactDetails,
      inquiry_id: inquiry.id,
      credits_remaining: tenantProfile.free_credits - 1,
    }
  }

  // 4. Initiate M-Pesa STK Push
  const { data: tenantUser } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('id', tenantUserId)
    .single()

  if (!tenantUser?.phone) throw unprocessable('Tenant phone not found')

  let stkResult: { checkoutRequestId: string }
  try {
    stkResult = await mpesaService.initiateStkPush({
      phone: tenantUser.phone,
      amount: UNLOCK_PRICE_KSH,
      accountRef: `MH${listingId.slice(0, 8).toUpperCase()}`,
      description: 'Unlock listing',
    })
  } catch (err) {
    throw unprocessable('M-Pesa request failed. Please try again.')
  }

  // Create pending payment
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: tenantUserId,
      type: 'unlock',
      amount_ksh: UNLOCK_PRICE_KSH,
      mpesa_checkout_id: stkResult.checkoutRequestId,
      status: 'pending',
      metadata: { listing_id: listingId },
    })
    .select('id')
    .single()

  if (paymentError || !payment) throw unprocessable('Failed to create payment record')

  // Create a locked inquiry record
  await supabaseAdmin.from('inquiries').insert({
    tenant_user_id: tenantUserId,
    listing_id: listingId,
    payment_id: payment.id,
    unlocked_at: null,
  })

  // Queue payment timeout job (2-minute delay)
  await paymentQueue.add(
    'payment-timeout',
    { paymentId: payment.id, userId: tenantUserId },
    { delay: 2 * 60 * 1000 }
  )

  return {
    status: 'pending',
    payment_id: payment.id,
    checkout_request_id: stkResult.checkoutRequestId,
    message: 'Enter your M-Pesa PIN on your phone to unlock contact details.',
  }
}

export async function getTenantInquiries(tenantUserId: string) {
  const { data, error } = await supabaseAdmin
    .from('inquiries')
    .select(`
      id, listing_id, unlocked_at, created_at,
      listings!listing_id(id, title, estate, rent_ksh, house_type, address,
        listing_photos(url, "order"))
    `)
    .eq('tenant_user_id', tenantUserId)
    .not('unlocked_at', 'is', null)
    .order('unlocked_at', { ascending: false })

  if (error) throw unprocessable(error.message)

  return (data ?? []).map((inq) => {
    const listing = inq.listings as {
      id: string; title: string; estate: string; rent_ksh: number;
      house_type: string; address: string;
      listing_photos: Array<{ url: string; order: number }>
    } | null
    return {
      inquiry_id: inq.id,
      unlocked_at: inq.unlocked_at,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            estate: listing.estate,
            rent_ksh: listing.rent_ksh,
            house_type: listing.house_type,
            cover_photo: (listing.listing_photos ?? []).sort((a, b) => a.order - b.order)[0]?.url ?? null,
          }
        : null,
      // Contact details are always included since tenant paid
      contact_details: listing ? { address: listing.address } : null,
    }
  })
}

async function createUnlockedInquiry(
  listingId: string,
  tenantUserId: string,
  paymentId: string | null
) {
  const { data, error } = await supabaseAdmin
    .from('inquiries')
    .upsert(
      {
        tenant_user_id: tenantUserId,
        listing_id: listingId,
        payment_id: paymentId,
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_user_id,listing_id' }
    )
    .select('id')
    .single()

  if (error || !data) throw unprocessable('Failed to create inquiry record')
  return data
}

async function getContactDetails(listingId: string) {
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('address, lister_user_id')
    .eq('id', listingId)
    .single()

  if (!listing) return null

  const { data: listerUser } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('id', listing.lister_user_id)
    .single()

  const phone = listerUser?.phone ?? ''
  return {
    address: listing.address,
    phone,
    whatsapp_url: `https://wa.me/${phone.replace(/[^0-9]/g, '')}`,
  }
}

async function notifyLister(listerUserId: string, estate: string) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('id', listerUserId)
    .single()

  if (user?.phone) {
    await sendSms({
      to: user.phone,
      message: smsTemplates.contactUnlocked(estate),
    })
  }
}
