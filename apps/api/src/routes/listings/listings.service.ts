import { supabaseAdmin } from '../../config/supabase'
import { alertQueue, fraudRefundQueue } from '../../jobs/queue'
import { notFound, forbidden, unprocessable, badRequest } from '../../utils/errors'
import { maskName } from '../../utils/mask'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'

const MIN_PHOTOS = 3

async function countPhotos(listingId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('listing_photos')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', listingId)
  return count ?? 0
}
import type { CreateListingInput, UpdateListingInput, ListingsQuery } from './listings.schema'

const LISTER_ROLES = ['landlord', 'caretaker', 'agency']

export async function getListings(query: ListingsQuery) {
  let dbQuery = supabaseAdmin
    .from('listings')
    .select(
      `id, title, estate, rent_ksh, bedrooms, house_type, available_from,
       verified_tier, saved_count, view_count, status, featured_until, created_at,
       lister_user_id,
       listing_photos(url, "order")`,
      { count: 'exact' }
    )
    .eq('status', 'available')

  if (query.estate) dbQuery = dbQuery.ilike('estate', query.estate)
  if (query.min_rent) dbQuery = dbQuery.gte('rent_ksh', query.min_rent)
  if (query.max_rent) dbQuery = dbQuery.lte('rent_ksh', query.max_rent)
  if (query.bedrooms !== undefined) dbQuery = dbQuery.eq('bedrooms', query.bedrooms)
  if (query.house_type) dbQuery = dbQuery.eq('house_type', query.house_type)
  if (query.verified_only) dbQuery = dbQuery.neq('verified_tier', 'none')
  if (query.available_now) dbQuery = dbQuery.lte('available_from', new Date().toISOString())

  switch (query.sort) {
    case 'price_asc': dbQuery = dbQuery.order('rent_ksh', { ascending: true }); break
    case 'price_desc': dbQuery = dbQuery.order('rent_ksh', { ascending: false }); break
    case 'most_saved': dbQuery = dbQuery.order('saved_count', { ascending: false }); break
    default: dbQuery = dbQuery.order('created_at', { ascending: false })
  }

  // Featured listings first
  dbQuery = dbQuery.order('featured_until', { ascending: false, nullsFirst: false })

  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  dbQuery = dbQuery.range(from, to)

  const { data, error, count } = await dbQuery
  if (error) throw unprocessable(error.message)

  // Batch-fetch lister verification status (listings has no direct FK to
  // lister_profiles, so we resolve id_verified in one extra query).
  const listerIds = [...new Set((data ?? []).map((l) => l.lister_user_id).filter(Boolean))]
  const verifiedByUser = new Map<string, boolean>()
  if (listerIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('lister_profiles')
      .select('user_id, id_verified')
      .in('user_id', listerIds)
    for (const p of profiles ?? []) verifiedByUser.set(p.user_id, p.id_verified)
  }

  const listings = (data ?? []).map((l) => ({
    ...l,
    cover_photo_url:
      (l.listing_photos as Array<{ url: string; order: number }>)
        ?.sort((a, b) => a.order - b.order)[0]?.url ?? null,
    listing_photos: undefined,
    is_featured: l.featured_until ? new Date(l.featured_until) > new Date() : false,
    lister_id_verified: verifiedByUser.get(l.lister_user_id) ?? false,
    // Never expose address or phone in list view
  }))

  return {
    listings,
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  }
}

export async function getListingById(listingId: string, userId?: string) {
  const { data: listing, error } = await supabaseAdmin
    .from('listings')
    .select(`
      id, title, description, estate, area, address, lat, lng,
      rent_ksh, deposit_ksh, house_type, bedrooms, bathrooms, size_sqft,
      available_from, status, verified_tier, saved_count, view_count,
      featured_until, created_at, updated_at, lister_user_id,
      listing_photos(id, url, "order"),
      listing_amenities(amenity)
    `)
    .eq('id', listingId)
    .single()

  if (error || !listing) throw notFound('Listing not found')
  if (listing.status === 'suspended') {
    return { error: 'This listing has been suspended', code: 'LISTING_SUSPENDED', statusCode: 410 }
  }

  // Increment view count
  await supabaseAdmin
    .from('listings')
    .update({ view_count: (listing.view_count ?? 0) + 1 })
    .eq('id', listingId)

  // Fetch lister info (no phone exposed)
  const { data: listerProfile } = await supabaseAdmin
    .from('lister_profiles')
    .select('full_name, id_verified, plan, plan_expires_at, created_at')
    .eq('user_id', listing.lister_user_id)
    .single()

  // Fetch reviews
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating, body, created_at, tenant_user_id')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Resolve reviewer names so they can be masked as "J*** M***"
  const reviewTenantIds = [...new Set((reviews ?? []).map((r) => r.tenant_user_id))]
  const reviewerNames = new Map<string, string>()
  if (reviewTenantIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('tenant_profiles')
      .select('user_id, full_name')
      .in('user_id', reviewTenantIds)
    for (const p of profiles ?? []) reviewerNames.set(p.user_id, p.full_name)
  }

  const maskedReviews = (reviews ?? []).map((r) => ({
    rating: r.rating,
    body: r.body,
    created_at: r.created_at,
    tenant_name_masked: maskName(reviewerNames.get(r.tenant_user_id)),
  }))

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  // Check if caller has unlocked this listing
  let contact_details: { address: string; phone: string; whatsapp_url: string } | null = null

  if (userId) {
    const { data: inquiry } = await supabaseAdmin
      .from('inquiries')
      .select('id')
      .eq('tenant_user_id', userId)
      .eq('listing_id', listingId)
      .not('unlocked_at', 'is', null)
      .maybeSingle()

    if (inquiry) {
      // Fetch lister phone
      const { data: listerUser } = await supabaseAdmin
        .from('users')
        .select('phone')
        .eq('id', listing.lister_user_id)
        .single()

      if (listerUser?.phone) {
        const phone = listerUser.phone
        contact_details = {
          address: listing.address,
          phone,
          whatsapp_url: `https://wa.me/${phone.replace(/[^0-9]/g, '')}`,
        }
      }
    }
  }

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    estate: listing.estate,
    area: listing.area,
    lat: listing.lat,
    lng: listing.lng,
    rent_ksh: listing.rent_ksh,
    deposit_ksh: listing.deposit_ksh,
    house_type: listing.house_type,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    size_sqft: listing.size_sqft,
    available_from: listing.available_from,
    status: listing.status,
    verified_tier: listing.verified_tier,
    saved_count: listing.saved_count,
    view_count: listing.view_count,
    is_featured: listing.featured_until ? new Date(listing.featured_until) > new Date() : false,
    photos: ((listing.listing_photos as Array<{ id: string; url: string; order: number }>) ?? [])
      .sort((a, b) => a.order - b.order),
    amenities: (listing.listing_amenities as Array<{ amenity: string }> ?? []).map((a) => a.amenity),
    lister: listerProfile
      ? {
          name: listerProfile.full_name,
          verified_tier: listerProfile.id_verified ? 'id' : 'phone',
          id_verified: listerProfile.id_verified ?? false,
          member_since: listerProfile.created_at,
        }
      : null,
    reviews: maskedReviews,
    average_rating: avgRating,
    review_count: reviews?.length ?? 0,
    contact_details,
  }
}

export async function createListing(input: CreateListingInput, userId: string, userRole: string) {
  // Check listing count for free tier
  const { count: existingCount } = await supabaseAdmin
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('lister_user_id', userId)
    .in('status', ['available', 'taken'])

  const { data: listerProfile } = await supabaseAdmin
    .from('lister_profiles')
    .select('plan, id_verified')
    .eq('user_id', userId)
    .single()

  const plan = listerProfile?.plan ?? 'free'
  const freeLimitMap: Record<string, number> = { landlord: 3, caretaker: 2 }
  const freeLimit = freeLimitMap[userRole] ?? 3

  if (plan === 'free' && userRole !== 'agency' && (existingCount ?? 0) >= freeLimit) {
    throw forbidden(
      `Free tier allows up to ${freeLimit} listings. Upgrade to Pro to add more.`
    )
  }

  const verifiedTier = listerProfile?.id_verified ? 'id' : 'phone'

  // Get agency_id if agency role
  let agencyId: string | null = null
  if (userRole === 'agency') {
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('id')
      .eq('owner_user_id', userId)
      .single()
    agencyId = agency?.id ?? null
  }

  const { amenities = [], ...listingData } = input

  const { data: listing, error } = await supabaseAdmin
    .from('listings')
    .insert({
      ...listingData,
      lister_user_id: userId,
      agency_id: agencyId,
      status: 'available',
      verified_tier: verifiedTier,
    })
    .select('id')
    .single()

  if (error || !listing) throw unprocessable(error?.message ?? 'Failed to create listing')

  // Insert amenities
  if (amenities.length > 0) {
    await supabaseAdmin.from('listing_amenities').insert(
      amenities.map((a) => ({ listing_id: listing.id, amenity: a }))
    )
  }

  // Queue search alert matcher
  await alertQueue.add('search-alert-matcher', {
    listingId: listing.id,
    estate: input.estate,
    bedrooms: input.bedrooms,
    rentKsh: input.rent_ksh,
    houseType: input.house_type,
  })

  // Notify the lister their listing is live (SMS — non-blocking)
  const { data: listerUser } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('id', userId)
    .single()
  if (listerUser?.phone) {
    await sendSms({
      to: listerUser.phone,
      message: smsTemplates.listingPublished(input.estate, listing.id),
      template: 'listingPublished',
    })
  }

  return { listing_id: listing.id, status: 'available', verified_tier: verifiedTier }
}

export async function updateListing(
  listingId: string,
  input: UpdateListingInput,
  userId: string,
  userRole: string
) {
  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('listings')
    .select('id, lister_user_id, estate, status')
    .eq('id', listingId)
    .single()

  if (!existing) throw notFound('Listing not found')
  if (existing.lister_user_id !== userId && userRole !== 'admin') {
    throw forbidden('You do not own this listing')
  }

  const { amenities, ...updateData } = input

  // PRD §8.5: a listing must have at least 3 photos to be (re)published.
  // Photos are uploaded after creation, so this is enforced when a listing is
  // set to 'available' rather than at create time.
  if (input.status === 'available') {
    const photoCount = await countPhotos(listingId)
    if (photoCount < MIN_PHOTOS) {
      throw badRequest(`A listing needs at least ${MIN_PHOTOS} photos before it can be published.`)
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from('listings')
    .update(updateData)
    .eq('id', listingId)
    .select()
    .single()

  if (error) throw unprocessable(error.message)

  // If marked as taken, queue a 24h-delayed refund check for recent unlocks
  if (input.status === 'taken' && existing.status !== 'taken') {
    await fraudRefundQueue.add(
      'fraud-refund-check',
      {
        listingId,
        estate: existing.estate,
        markedTakenAt: new Date().toISOString(),
      },
      { delay: 24 * 60 * 60 * 1000 }
    )
  }

  return updated
}

export async function deleteListing(listingId: string, userId: string, userRole: string) {
  const { data: existing } = await supabaseAdmin
    .from('listings')
    .select('id, lister_user_id')
    .eq('id', listingId)
    .single()

  if (!existing) throw notFound('Listing not found')
  if (existing.lister_user_id !== userId && userRole !== 'admin') {
    throw forbidden('You do not own this listing')
  }

  await supabaseAdmin.from('listings').delete().eq('id', listingId)
}

export async function toggleSave(listingId: string, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('saved_listings')
    .select('id')
    .eq('tenant_user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin.from('saved_listings').delete().eq('id', existing.id)
    await supabaseAdmin
      .from('listings')
      .update({ saved_count: supabaseAdmin.rpc('decrement', { x: 1 }) as unknown as number })
      .eq('id', listingId)
    return { saved: false }
  } else {
    await supabaseAdmin.from('saved_listings').insert({
      tenant_user_id: userId,
      listing_id: listingId,
    })
    await supabaseAdmin.rpc('increment_saved_count', { listing_id: listingId })
    return { saved: true }
  }
}
