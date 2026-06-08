import { supabaseAdmin } from '../../config/supabase'

export interface ListerAnalytics {
  total_views: number
  total_unlocks: number
  total_revenue: number
  inquiry_count: number
  unlocks_daily: Array<{ day: string; count: number }>
  top_listings: Array<{ id: string; title: string; views: number; unlocks: number }>
}

/**
 * Analytics for a single lister, scoped strictly to listings they own.
 * (Plan-gating is enforced by the route; this is the data layer.)
 */
export async function getListerAnalytics(userId: string): Promise<ListerAnalytics> {
  const { data: listingRows } = await supabaseAdmin
    .from('listings')
    .select('id, title, view_count')
    .eq('lister_user_id', userId)

  const listings = listingRows ?? []
  const listingIds = listings.map((l) => l.id)
  const total_views = listings.reduce((sum, l) => sum + (l.view_count ?? 0), 0)

  if (listingIds.length === 0) {
    return { total_views: 0, total_unlocks: 0, total_revenue: 0, inquiry_count: 0, unlocks_daily: [], top_listings: [] }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const { data: unlockedInquiries } = await supabaseAdmin
    .from('inquiries')
    .select('listing_id, unlocked_at')
    .in('listing_id', listingIds)
    .not('unlocked_at', 'is', null)

  const { count: inquiry_count } = await supabaseAdmin
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .in('listing_id', listingIds)

  const unlocks = unlockedInquiries ?? []
  const total_unlocks = unlocks.length

  // Daily unlocks for the last 30 days
  const dailyMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dailyMap.set(`${d.getMonth() + 1}/${d.getDate()}`, 0)
  }
  for (const inq of unlocks) {
    if (!inq.unlocked_at) continue
    const d = new Date(inq.unlocked_at)
    if (d < thirtyDaysAgo) continue
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1)
  }
  const unlocks_daily = Array.from(dailyMap.entries()).map(([day, count]) => ({ day, count }))

  const unlockCountByListing = new Map<string, number>()
  for (const inq of unlocks) {
    unlockCountByListing.set(inq.listing_id, (unlockCountByListing.get(inq.listing_id) ?? 0) + 1)
  }
  const top_listings = listings
    .map((l) => ({ id: l.id, title: l.title, views: l.view_count ?? 0, unlocks: unlockCountByListing.get(l.id) ?? 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  const { data: unlockPayments } = await supabaseAdmin
    .from('payments')
    .select('amount_ksh, metadata')
    .eq('type', 'unlock')
    .eq('status', 'complete')
  const total_revenue = (unlockPayments ?? [])
    .filter((p) => listingIds.includes((p.metadata as { listing_id?: string })?.listing_id ?? ''))
    .reduce((sum, p) => sum + (p.amount_ksh ?? 0), 0)

  return { total_views, total_unlocks, total_revenue, inquiry_count: inquiry_count ?? 0, unlocks_daily, top_listings }
}
