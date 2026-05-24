import { supabaseAdmin } from '../../config/supabase'
import { unprocessable } from '../../utils/errors'

export async function getUserReports(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('fraud_reports')
    .select('id, listing_id, reason, note, resolved, created_at')
    .eq('reporter_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw unprocessable(error.message)
  return data ?? []
}
