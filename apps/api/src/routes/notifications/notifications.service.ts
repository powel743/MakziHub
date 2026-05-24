import { supabaseAdmin } from '../../config/supabase'
import { notFound, unprocessable } from '../../utils/errors'

export async function getNotifications(userId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabaseAdmin
    .from('notifications')
    .select('id, type, title, body, read, metadata, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw unprocessable(error.message)

  const { count: unreadCount } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  return {
    notifications: data ?? [],
    total: count ?? 0,
    unread_count: unreadCount ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  }
}

export async function markRead(notificationId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id')
    .eq('id', notificationId)
    .single()

  if (!data || data.user_id !== userId) throw notFound('Notification not found')

  await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
}

export async function markAllRead(userId: string) {
  await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
}
