import { describe, it, expect, vi } from 'vitest'

// Resolver mock: getAdminStats fires several count queries via Promise.all
// (non-deterministic order), so we resolve by query shape (table + head) rather
// than a FIFO queue.
const { supabase } = vi.hoisted(() => {
  const make = (table: string) => {
    const ctx = { table, head: false }
    const b: any = {}
    b.select = (_cols: string, opts?: any) => {
      if (opts?.head) ctx.head = true
      return b
    }
    for (const m of ['eq', 'gte', 'lt', 'lte', 'not', 'or', 'order', 'range', 'in', 'single', 'maybeSingle']) b[m] = () => b
    b.then = (resolve: any, reject: any) =>
      Promise.resolve()
        .then(() => {
          if (ctx.head) return { count: 5 }
          if (ctx.table === 'fraud_reports') return { data: [{ listing_id: 'a' }, { listing_id: 'a' }, { listing_id: 'b' }] }
          if (ctx.table === 'payments') return { data: [{ amount_ksh: 100 }, { amount_ksh: 200 }] }
          return { data: [] }
        })
        .then(resolve, reject)
    return b
  }
  return { supabase: { from: (t: string) => make(t) } }
})

vi.mock('../../../config/supabase', () => ({ supabaseAdmin: supabase }))
vi.mock('../../../services/africasTalking.service', () => ({ sendSms: vi.fn().mockResolvedValue({ success: true }) }))

import { getAdminStats } from '../admin.service'

describe('getAdminStats', () => {
  it('returns the expected shape with each field sourced from its query', async () => {
    const stats = await getAdminStats()

    // Required shape (PRD / task D4)
    expect(stats).toMatchObject({
      total_listings: expect.any(Number),
      total_users: expect.any(Number),
      total_revenue: expect.any(Number),
      active_listings: expect.any(Number),
      pending_verifications: expect.any(Number),
    })

    // Counts come from head:true count queries → 5
    expect(stats.total_listings).toBe(5)
    expect(stats.active_listings).toBe(5)
    expect(stats.total_users).toBe(5)
    expect(stats.open_fraud_reports).toBe(5)
    expect(stats.pending_verifications).toBe(5)

    // pending_moderation = distinct listing_ids among unresolved fraud reports (a,a,b → 2)
    expect(stats.pending_moderation).toBe(2)

    // revenue = sum of completed payment amounts (100 + 200)
    expect(stats.total_revenue).toBe(300)
    expect(stats.revenue_mtd).toBe(300)
  })
})
