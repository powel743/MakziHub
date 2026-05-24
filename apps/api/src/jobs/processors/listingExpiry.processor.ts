import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { sendNotificationEmail } from '../../services/africasTalking.service'
import logger from '../../utils/logger'

export async function listingExpiryProcessor(job: Job): Promise<void> {
  logger.info({ jobId: job.id }, 'Running listing expiry check')

  const now = new Date()
  const thirtyEightDaysAgo = new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000)
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)

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
    await supabaseAdmin.from('listings').update({ status: 'expired' }).in('id', ids)
    logger.info({ count: ids.length }, 'Expired stale listings')
  }

  const { data: toWarn, error: warnError } = await supabaseAdmin
    .from('listings')
    .select('id, estate, lister_user_id, users!lister_user_id(email)')
    .eq('status', 'available')
    .lt('updated_at', thirtyEightDaysAgo.toISOString())
    .gte('updated_at', fortyFiveDaysAgo.toISOString())

  if (warnError) {
    logger.error({ error: warnError }, 'Failed to fetch listings to warn')
    throw warnError
  }

  if (toWarn && toWarn.length > 0) {
    for (const listing of toWarn) {
      const user = listing.users as { email: string } | null
      if (user?.email) {
        await sendNotificationEmail({
          to: user.email,
          subject: 'Your listing expires in 7 days',
          html: `<p>Your listing at <strong>${listing.estate}</strong> expires in 7 days. <a href="https://makazihub.co.ke/lister/listings">Log in to confirm it's still available</a>.</p>`,
        })
      }
    }
    logger.info({ count: toWarn.length }, 'Sent listing expiry warnings')
  }
}
