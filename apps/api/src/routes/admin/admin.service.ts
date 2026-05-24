import { supabaseAdmin } from '../../config/supabase'
import { notFound, unprocessable } from '../../utils/errors'

export async function getModerationQueue(status?: string, page = 1, limit = 20) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin
    .from('listings')
    .select(
      'id, title, estate, status, verified_tier, created_at, lister_user_id, lister_profiles!lister_user_id(full_name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status === 'reported') {
    // Listings with unresolved fraud reports
    const { data: reportedIds } = await supabaseAdmin
      .from('fraud_reports')
      .select('listing_id')
      .eq('resolved', false)
    const ids = [...new Set((reportedIds ?? []).map((r) => r.listing_id))]
    if (ids.length === 0) return { listings: [], total: 0, page, pages: 0 }
    query = query.in('id', ids)
  } else if (status === 'new') {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', oneDayAgo).eq('status', 'available')
  } else if (status === 'suspended') {
    query = query.eq('status', 'suspended')
  }

  const { data, error, count } = await query
  if (error) throw unprocessable(error.message)

  return {
    listings: data ?? [],
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  }
}

export async function adminUpdateListing(
  listingId: string,
  status: 'available' | 'suspended',
  reason?: string
) {
  const { data, error } = await supabaseAdmin
    .from('listings')
    .update({ status })
    .eq('id', listingId)
    .select()
    .single()

  if (error) throw unprocessable(error.message)
  return data
}

export async function searchUsers(search: string, page = 1, limit = 20) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabaseAdmin
    .from('users')
    .select('id, email, phone, role, verified_phone, suspended, banned, created_at', {
      count: 'exact',
    })
    .or(`email.ilike.%${search}%,phone.ilike.%${search}%`)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw unprocessable(error.message)
  return { users: data ?? [], total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) }
}

export async function adminUpdateUser(
  userId: string,
  action: string,
  reason?: string,
  adminId?: string
) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()
  if (!user) throw notFound('User not found')

  switch (action) {
    case 'approve_id':
      await supabaseAdmin
        .from('lister_profiles')
        .update({ id_verified: true })
        .eq('user_id', userId)
      break
    case 'suspend':
      await supabaseAdmin.from('users').update({ suspended: true }).eq('id', userId)
      break
    case 'unsuspend':
      await supabaseAdmin.from('users').update({ suspended: false }).eq('id', userId)
      break
    case 'ban':
      await supabaseAdmin.from('users').update({ banned: true }).eq('id', userId)
      break
    case 'unban':
      await supabaseAdmin.from('users').update({ banned: false }).eq('id', userId)
      break
  }

  return { user_id: userId, action, applied: true }
}

export async function getFraudReports(resolved: boolean, page = 1, limit = 20) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabaseAdmin
    .from('fraud_reports')
    .select(
      'id, listing_id, reporter_user_id, reason, note, resolved, created_at, listings!listing_id(title, estate)',
      { count: 'exact' }
    )
    .eq('resolved', resolved)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw unprocessable(error.message)
  return { reports: data ?? [], total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) }
}

export async function resolveFraudReport(
  reportId: string,
  action: string,
  note?: string,
  adminId?: string
) {
  const { data: report } = await supabaseAdmin
    .from('fraud_reports')
    .select('id, listing_id')
    .eq('id', reportId)
    .single()

  if (!report) throw notFound('Fraud report not found')

  await supabaseAdmin.from('fraud_reports').update({
    resolved: true,
    resolution_action: action,
    resolved_by: adminId,
    resolved_at: new Date().toISOString(),
  }).eq('id', reportId)

  if (action === 'suspend_listing') {
    await supabaseAdmin
      .from('listings')
      .update({ status: 'suspended' })
      .eq('id', report.listing_id)
  }

  return { report_id: reportId, action, resolved: true }
}

export async function getRevenueReport(month: string) {
  // month format: YYYY-MM
  const startDate = new Date(`${month}-01T00:00:00Z`)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 1)

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('type, amount_ksh, status, created_at')
    .eq('status', 'complete')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString())

  if (error) throw unprocessable(error.message)

  const summary: Record<string, { count: number; total: number }> = {}
  let grandTotal = 0

  for (const payment of data ?? []) {
    if (!summary[payment.type]) summary[payment.type] = { count: 0, total: 0 }
    summary[payment.type].count++
    summary[payment.type].total += payment.amount_ksh
    grandTotal += payment.amount_ksh
  }

  return {
    month,
    grand_total_ksh: grandTotal,
    by_type: summary,
    transaction_count: data?.length ?? 0,
  }
}
