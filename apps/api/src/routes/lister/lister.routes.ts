import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import { supabaseAdmin } from '../../config/supabase'
import { getListerAnalytics } from './lister.service'

const LISTER_ROLES = ['landlord', 'caretaker', 'agency'] as const

export async function listerRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /v1/lister/stats
   * Returns dashboard summary stats for the authenticated lister.
   */
  fastify.get('/stats', {
    preHandler: [requireAuth, requireRole(...LISTER_ROLES)],
    schema: { tags: ['lister'] },
  }, async (request, reply) => {
    const userId = request.user.sub

    // Active listings count
    const { count: activeLisitngs } = await supabaseAdmin
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('lister_user_id', userId)
      .eq('status', 'available')

    // Total listings count (for "my listings" badge)
    const { count: totalListings } = await supabaseAdmin
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('lister_user_id', userId)

    // Get listing IDs for this lister (needed for cross-table counts)
    const { data: listingRows } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('lister_user_id', userId)

    const listingIds = listingRows?.map((l) => l.id) ?? []

    // Inquiries received this calendar month
    let inquiriesMonth = 0
    let unlocksMonth = 0

    if (listingIds.length > 0) {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { count: inqCount } = await supabaseAdmin
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .in('listing_id', listingIds)
        .gte('created_at', monthStart.toISOString())

      inquiriesMonth = inqCount ?? 0

      // Unlocks = inquiries that were actually unlocked this month
      const { count: unlockCount } = await supabaseAdmin
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .in('listing_id', listingIds)
        .not('unlocked_at', 'is', null)
        .gte('unlocked_at', monthStart.toISOString())

      unlocksMonth = unlockCount ?? 0
    }

    // Profile views in last 7 days — sum view_count across active listings
    // (view_count is incremented per-listing on each detail page load)
    let profileViews7d = 0
    if (listingIds.length > 0) {
      const { data: viewData } = await supabaseAdmin
        .from('listings')
        .select('view_count')
        .eq('lister_user_id', userId)
        .eq('status', 'available')

      // We don't store per-day views yet, so return the total as a proxy.
      // TODO: add a daily_views table in Phase 2 for accurate 7d tracking.
      profileViews7d = viewData?.reduce((sum, l) => sum + (l.view_count ?? 0), 0) ?? 0
    }

    return reply.send({
      active_listings: activeLisitngs ?? 0,
      total_listings: totalListings ?? 0,
      inquiries_month: inquiriesMonth,
      unlocks_month: unlocksMonth,
      profile_views_7d: profileViews7d,
    })
  })

  /**
   * GET /v1/lister/analytics
   * Pro/Business analytics: per-listing views, daily unlocks (last 30 days),
   * total unlocks, revenue generated, and top-performing listings.
   * Pro and Business plans only.
   */
  fastify.get('/analytics', {
    preHandler: [requireAuth, requireRole(...LISTER_ROLES)],
    schema: { tags: ['lister'] },
  }, async (request, reply) => {
    const userId = request.user.sub

    // Gate to paid plans
    const { data: profile } = await supabaseAdmin
      .from('lister_profiles')
      .select('plan')
      .eq('user_id', userId)
      .single()

    if (!profile || profile.plan === 'free') {
      return reply.status(403).send({ error: 'Analytics is available on Pro and Business plans' })
    }

    const result = await getListerAnalytics(userId)
    return reply.send(result)
  })
}
