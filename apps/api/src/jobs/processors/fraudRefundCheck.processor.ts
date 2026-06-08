import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'
import logger from '../../utils/logger'

interface FraudRefundData {
  listingId: string
  estate: string
  markedTakenAt: string
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

// PRD §8.4: if a listing is marked "Taken" within 24h of a tenant's unlock, the
// unlock fee is automatically refunded. This job is enqueued with a 24h delay when
// a listing flips to 'taken'; on fire it refunds non-refunded unlocks from the 24h
// window before the listing was taken — but only if the listing is still 'taken'
// (if the lister flipped it back to 'available', no refund is due).
export async function fraudRefundCheckProcessor(job: Job<FraudRefundData>): Promise<void> {
  const { listingId, estate, markedTakenAt } = job.data
  logger.info({ jobId: job.id, listingId }, 'Running 24h taken-refund check')

  // 1. Confirm the listing is still 'taken'
  const { data: listing, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, status, estate')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    logger.warn({ listingId, error: listingError }, 'Listing not found in refund check')
    return
  }

  if (listing.status !== 'taken') {
    logger.info({ listingId, status: listing.status }, 'Listing no longer taken — no refund due')
    return
  }

  // 2. Find non-refunded unlocks from the 24h window before it was marked taken
  const takenAt = new Date(markedTakenAt).getTime()
  const windowStart = new Date(takenAt - TWENTY_FOUR_HOURS_MS).toISOString()

  const { data: inquiries, error: inquiryError } = await supabaseAdmin
    .from('inquiries')
    .select('id, tenant_user_id, payment_id, unlocked_at, users!tenant_user_id(phone)')
    .eq('listing_id', listingId)
    .eq('refunded', false)
    .not('unlocked_at', 'is', null)
    .gte('unlocked_at', windowStart)
    .lte('unlocked_at', markedTakenAt)

  if (inquiryError) {
    logger.error({ error: inquiryError, listingId }, 'Failed to fetch unlocks for refund')
    throw inquiryError
  }

  if (!inquiries || inquiries.length === 0) {
    logger.info({ listingId }, 'No recent unlocks to refund')
    return
  }

  for (const inquiry of inquiries) {
    const user = inquiry.users as unknown as { phone: string } | null

    // a) Mark the unlock payment as refunded (if it was a paid unlock)
    if (inquiry.payment_id) {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', inquiry.payment_id)
        .eq('status', 'complete')
      // M-Pesa B2C reversal stub — real cash reversal handled in Phase 2.
      logger.info(
        { paymentId: inquiry.payment_id, tenantId: inquiry.tenant_user_id },
        'M-Pesa reversal stub — refunding unlock as account credit'
      )
    }

    // b) Restore the tenant's free credit
    const { data: profile } = await supabaseAdmin
      .from('tenant_profiles')
      .select('free_credits')
      .eq('user_id', inquiry.tenant_user_id)
      .single()

    const newCredits = (profile?.free_credits ?? 0) + 1
    await supabaseAdmin
      .from('tenant_profiles')
      .update({ free_credits: newCredits })
      .eq('user_id', inquiry.tenant_user_id)

    // c) Mark the inquiry refunded so it is never double-refunded
    await supabaseAdmin.from('inquiries').update({ refunded: true }).eq('id', inquiry.id)

    // d) Notify the tenant (in-app + SMS)
    const message = smsTemplates.fraudAutoRefund(estate ?? listing.estate ?? 'the property', newCredits)
    await supabaseAdmin.from('notifications').insert({
      user_id: inquiry.tenant_user_id,
      type: 'taken_refund',
      title: 'Unlock Fee Refunded',
      body: message,
      metadata: { listing_id: listingId },
    })

    if (user?.phone) {
      await sendSms({ to: user.phone, message, template: 'takenRefund' })
    }
  }

  logger.info(
    { listingId, refunded: inquiries.length },
    'Refunded recent unlocks for listing marked taken within 24h'
  )
}
