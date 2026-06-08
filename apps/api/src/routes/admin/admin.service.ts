import { supabaseAdmin } from '../../config/supabase'
import { notFound, unprocessable } from '../../utils/errors'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'

export async function getAdminStats() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const countOf = async (
    table: string,
    apply: (q: any) => any = (q) => q
  ): Promise<number> => {
    const { count } = await apply(
      supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
    )
    return count ?? 0
  }

  const [
    total_listings,
    active_listings,
    new_listings_today,
    total_users,
    open_fraud_reports,
    pending_verifications,
  ] = await Promise.all([
    countOf('listings'),
    countOf('listings', (q) => q.eq('status', 'available')),
    countOf('listings', (q) => q.gte('created_at', todayStart.toISOString())),
    countOf('users'),
    countOf('fraud_reports', (q) => q.eq('resolved', false)),
    countOf('lister_profiles', (q) => q.eq('id_verified', false).not('id_doc_url', 'is', null)),
  ])

  // Listings awaiting moderation = those with at least one unresolved fraud report
  const { data: reportedRows } = await supabaseAdmin
    .from('fraud_reports')
    .select('listing_id')
    .eq('resolved', false)
  const pending_moderation = new Set((reportedRows ?? []).map((r) => r.listing_id)).size

  // Revenue (completed payments): all-time and month-to-date
  const sumPayments = async (since?: string): Promise<number> => {
    let q = supabaseAdmin.from('payments').select('amount_ksh').eq('status', 'complete')
    if (since) q = q.gte('created_at', since)
    const { data } = await q
    return (data ?? []).reduce((sum, p) => sum + (p.amount_ksh ?? 0), 0)
  }
  const [total_revenue, revenue_mtd] = await Promise.all([
    sumPayments(),
    sumPayments(monthStart.toISOString()),
  ])

  return {
    total_listings,
    active_listings,
    new_listings_today,
    total_users,
    open_fraud_reports,
    pending_moderation,
    pending_verifications,
    total_revenue,
    revenue_mtd,
  }
}

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

export async function getVerifications(status: string, page = 1, limit = 20) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabaseAdmin
    .from('verifications')
    .select(
      'id, user_id, id_type, front_url, back_url, status, rejection_reason, submitted_at, reviewed_at, users!user_id(email, phone)',
      { count: 'exact' }
    )
    .eq('status', status)
    .order('submitted_at', { ascending: false })
    .range(from, to)

  if (error) throw unprocessable(error.message)

  // Resolve lister display names (agency_members aren't an FK to lister_profiles)
  const userIds = [...new Set((data ?? []).map((v) => v.user_id))]
  const nameByUser = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('lister_profiles')
      .select('user_id, full_name')
      .in('user_id', userIds)
    for (const p of profiles ?? []) nameByUser.set(p.user_id, p.full_name)
  }

  const verifications = (data ?? []).map((v) => {
    const u = (Array.isArray(v.users) ? v.users[0] : v.users) as { email: string; phone: string } | null
    return {
      id: v.id,
      user_id: v.user_id,
      name: nameByUser.get(v.user_id) ?? null,
      email: u?.email ?? null,
      phone: u?.phone ?? null,
      id_type: v.id_type,
      front_url: v.front_url,
      back_url: v.back_url,
      status: v.status,
      rejection_reason: v.rejection_reason,
      submitted_at: v.submitted_at,
      reviewed_at: v.reviewed_at,
    }
  })

  return { verifications, total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) }
}

export async function approveVerification(verificationId: string, adminId: string) {
  const { data: v } = await supabaseAdmin
    .from('verifications')
    .select('id, user_id')
    .eq('id', verificationId)
    .single()
  if (!v) throw notFound('Verification not found')

  await supabaseAdmin
    .from('verifications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewer_id: adminId })
    .eq('id', verificationId)

  await supabaseAdmin
    .from('lister_profiles')
    .update({ id_verified: true, verification_status: 'verified' })
    .eq('user_id', v.user_id)

  const { data: user } = await supabaseAdmin.from('users').select('phone').eq('id', v.user_id).single()
  if (user?.phone) {
    await sendSms({
      to: user.phone,
      message: smsTemplates.idVerificationApproved(),
      template: 'idVerificationApproved',
    })
  }

  return { message: 'Approved' }
}

export async function rejectVerification(verificationId: string, reason: string, adminId: string) {
  if (!reason || !reason.trim()) throw unprocessable('A rejection reason is required')

  const { data: v } = await supabaseAdmin
    .from('verifications')
    .select('id, user_id')
    .eq('id', verificationId)
    .single()
  if (!v) throw notFound('Verification not found')

  await supabaseAdmin
    .from('verifications')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewer_id: adminId,
    })
    .eq('id', verificationId)

  await supabaseAdmin
    .from('lister_profiles')
    .update({ verification_status: 'rejected' })
    .eq('user_id', v.user_id)

  const { data: user } = await supabaseAdmin.from('users').select('phone').eq('id', v.user_id).single()
  if (user?.phone) {
    await sendSms({
      to: user.phone,
      message: `Your ID verification was not approved: ${reason}. Please resubmit with a clearer photo.`,
      template: 'idVerificationRejected',
    })
  }

  return { message: 'Rejected' }
}

export async function getEstate(id: string) {
  const { data, error } = await supabaseAdmin
    .from('approved_estates')
    .select('id, name, slug, description, transport_links, nearby_schools, seo_meta_description, active')
    .eq('id', id)
    .single()
  if (error || !data) throw notFound('Estate not found')
  return data
}

export async function updateEstate(
  id: string,
  input: {
    description?: string
    transport_links?: string[]
    nearby_schools?: string[]
    seo_meta_description?: string
  }
) {
  const patch: Record<string, unknown> = {}
  if (input.description !== undefined) patch.description = input.description
  if (input.transport_links !== undefined) patch.transport_links = input.transport_links
  if (input.nearby_schools !== undefined) patch.nearby_schools = input.nearby_schools
  if (input.seo_meta_description !== undefined) patch.seo_meta_description = input.seo_meta_description

  const { data, error } = await supabaseAdmin
    .from('approved_estates')
    .update(patch)
    .eq('id', id)
    .select('id, name, slug, description, transport_links, nearby_schools, seo_meta_description')
    .single()
  if (error) throw unprocessable(error.message)
  return data
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
