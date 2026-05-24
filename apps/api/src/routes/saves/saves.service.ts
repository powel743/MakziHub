import { supabaseAdmin } from '../../config/supabase'
import { unprocessable } from '../../utils/errors'

export async function getSavedListings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('saved_listings')
    .select(`
      id, created_at,
      listings!listing_id(
        id, title, estate, rent_ksh, bedrooms, house_type, status, available_from,
        listing_photos(url, "order")
      )
    `)
    .eq('tenant_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw unprocessable(error.message)

  return (data ?? []).map((s) => {
    const listing = s.listings as unknown as {
      id: string; title: string; estate: string; rent_ksh: number
      bedrooms: number; house_type: string; status: string; available_from: string
      listing_photos: Array<{ url: string; order: number }>
    } | null
    return {
      saved_id: s.id,
      saved_at: s.created_at,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            estate: listing.estate,
            rent_ksh: listing.rent_ksh,
            bedrooms: listing.bedrooms,
            house_type: listing.house_type,
            status: listing.status,
            available_from: listing.available_from,
            cover_photo:
              (listing.listing_photos ?? []).sort((a, b) => a.order - b.order)[0]?.url ?? null,
          }
        : null,
    }
  })
}
