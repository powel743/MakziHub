import { supabaseAdmin } from '../../config/supabase'
import { conflict, forbidden, notFound, unprocessable } from '../../utils/errors'
import type { CreateReviewInput } from './reviews.schema'

export async function createReview(input: CreateReviewInput, tenantUserId: string) {
  // Verify tenant actually unlocked this listing
  const { data: inquiry } = await supabaseAdmin
    .from('inquiries')
    .select('id')
    .eq('tenant_user_id', tenantUserId)
    .eq('listing_id', input.listing_id)
    .not('unlocked_at', 'is', null)
    .maybeSingle()

  if (!inquiry) {
    throw forbidden('You must unlock a listing before reviewing it')
  }

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('tenant_user_id', tenantUserId)
    .eq('listing_id', input.listing_id)
    .maybeSingle()

  if (existing) throw conflict('You have already reviewed this listing')

  const { data: review, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      tenant_user_id: tenantUserId,
      listing_id: input.listing_id,
      rating: input.rating,
      body: input.body,
    })
    .select('id, rating, body, created_at')
    .single()

  if (error) throw unprocessable(error.message)
  return review
}

export async function getListingReviews(listingId: string) {
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .single()

  if (!listing) throw notFound('Listing not found')

  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, body, created_at, tenant_user_id')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (error) throw unprocessable(error.message)

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return {
    reviews: (reviews ?? []).map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      created_at: r.created_at,
      reviewer: `T***${r.tenant_user_id.slice(-4)}`,
    })),
    average_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    count: reviews?.length ?? 0,
  }
}

export async function deleteReview(reviewId: string, userId: string, role: string) {
  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select('id, tenant_user_id')
    .eq('id', reviewId)
    .single()

  if (!review) throw notFound('Review not found')
  if (review.tenant_user_id !== userId && role !== 'admin') {
    throw forbidden('You cannot delete this review')
  }

  await supabaseAdmin.from('reviews').delete().eq('id', reviewId)
}
