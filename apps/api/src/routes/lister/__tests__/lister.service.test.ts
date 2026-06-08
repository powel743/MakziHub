import { describe, it, expect, beforeEach, vi } from 'vitest'

// FIFO supabase mock: each awaited query consumes the next queued result.
// getListerAnalytics issues its queries sequentially, so order is deterministic.
const { queue, supabase } = vi.hoisted(() => {
  const queue: any[] = []
  const makeBuilder = () => {
    const b: any = {}
    const methods = ['select', 'eq', 'gte', 'lt', 'lte', 'not', 'or', 'order', 'range', 'in', 'single', 'maybeSingle', 'update', 'insert', 'delete']
    for (const m of methods) b[m] = () => b
    b.then = (resolve: any, reject: any) =>
      Promise.resolve()
        .then(() => queue.shift() ?? { data: null, error: null, count: 0 })
        .then(resolve, reject)
    return b
  }
  return { queue, supabase: { from: () => makeBuilder() } }
})

vi.mock('../../../config/supabase', () => ({ supabaseAdmin: supabase }))

import { getListerAnalytics } from '../lister.service'

beforeEach(() => {
  queue.length = 0
})

describe('getListerAnalytics', () => {
  it('returns views, unlocks, revenue and inquiry_count for the lister', async () => {
    const nowIso = new Date().toISOString()
    queue.push(
      { data: [{ id: 'l1', title: 'A', view_count: 10 }, { id: 'l2', title: 'B', view_count: 5 }] },
      { data: [
        { listing_id: 'l1', unlocked_at: nowIso },
        { listing_id: 'l1', unlocked_at: nowIso },
        { listing_id: 'l2', unlocked_at: nowIso },
      ] },
      { count: 3 },
      { data: [
        { amount_ksh: 100, metadata: { listing_id: 'l1' } },
        { amount_ksh: 100, metadata: { listing_id: 'NOT_MINE' } },
      ] },
    )

    const res = await getListerAnalytics('user-1')

    expect(res.total_views).toBe(15)
    expect(res.total_unlocks).toBe(3)
    expect(res.inquiry_count).toBe(3)
    // Only the payment whose listing belongs to this lister counts
    expect(res.total_revenue).toBe(100)
    expect(res.unlocks_daily).toHaveLength(30)
    expect(res.top_listings[0].id).toBe('l1') // sorted by views desc
    expect(res.top_listings[0].unlocks).toBe(2)
  })

  it('returns zeroes when the lister has no listings', async () => {
    queue.push({ data: [] })
    const res = await getListerAnalytics('user-2')
    expect(res).toEqual({
      total_views: 0,
      total_unlocks: 0,
      total_revenue: 0,
      inquiry_count: 0,
      unlocks_daily: [],
      top_listings: [],
    })
  })
})
