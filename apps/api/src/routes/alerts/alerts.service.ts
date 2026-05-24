import { supabaseAdmin } from '../../config/supabase'
import { notFound, unprocessable } from '../../utils/errors'
import type { CreateAlertInput } from './alerts.schema'

export async function createAlert(input: CreateAlertInput, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('search_alerts')
    .insert({ tenant_user_id: userId, ...input })
    .select()
    .single()
  if (error) throw unprocessable(error.message)
  return data
}

export async function getUserAlerts(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('search_alerts')
    .select('*')
    .eq('tenant_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw unprocessable(error.message)
  return data ?? []
}

export async function deleteAlert(alertId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('search_alerts')
    .select('id, tenant_user_id')
    .eq('id', alertId)
    .single()
  if (!data) throw notFound('Alert not found')
  if (data.tenant_user_id !== userId) throw notFound('Alert not found')
  await supabaseAdmin.from('search_alerts').delete().eq('id', alertId)
}

export async function toggleAlert(alertId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('search_alerts')
    .select('id, tenant_user_id, active')
    .eq('id', alertId)
    .single()
  if (!data) throw notFound('Alert not found')
  if (data.tenant_user_id !== userId) throw notFound('Alert not found')

  const { data: updated, error } = await supabaseAdmin
    .from('search_alerts')
    .update({ active: !data.active })
    .eq('id', alertId)
    .select()
    .single()
  if (error) throw unprocessable(error.message)
  return updated
}
