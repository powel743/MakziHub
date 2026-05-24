import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'
import logger from '../../utils/logger'

export async function listingExpiryProcessor(job: Job): Promise<void> {
  logger.info({ jobId: job.id }, 'Running listing expiry check')

  const now = new Date()
  const thirtyEightDaysAgo = new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000)
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)

  // Find listings not updated in 45+ days → expire them
  const { data: toExpire, error: expireError } = await supabaseAdmin
    .from('listings')
    .select('id, estate, lister_user_id')
    .eq('status', 'available')
    .lt('updated_at', fortyFiveDaysAgo.toISOString())

  if (expireError) {
    logger.error({ error: expireError }, 'Failed to fetch listings to expire')
    throw expireError
  }

  if (toExpire && toExpire.length > 0) {
    const ids = toExpire.map((l) => l.id)
    await supabaseAdmin
      .from('listings')
      .update({ status: 'expired' })
      .in('id', ids)

    logger.info({ count: ids.length }, 'Expired stale listings')
  }

  // Find listings not updated in 38–45 days → send 7-day warning
  const { data: toWarn, error: warnError } = await supabaseAdmin
    .from('listings')
    .select('id, estate, lister_user_id, users!lister_user_id(phone)')
    .eq('status', 'available')
    .lt('updated_at', thirtyEightDaysAgo.toISOString())
    .gte('updated_at', fortyFiveDaysAgo.toISOString())

  if (warnError) {
    logger.error({ error: warnError }, 'Failed to fetch listings to warn')
    throw warnError
  }

  if (toWarn && toWarn.length > 0) {
    for (const listing of toWarn) {
      const user = listing.users as { phone: string } | null
      if (user?.phone) {
        await sendSms({
          to: user.phone,
          message: smsTemplates.listingExpiryWarning(listing.estate),
        })
      }
    }

    logger.info({ count: toWarn.length }, 'Sent listing expiry warnings')
  }
}
