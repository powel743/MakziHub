import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'
import logger from '../../utils/logger'

export async function planExpiryProcessor(job: Job): Promise<void> {
  logger.info({ jobId: job.id }, 'Running plan expiry check')

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Find plans expiring in 3 days → send reminder
  const { data: expiringSoon, error: soonError } = await supabaseAdmin
    .from('lister_profiles')
    .select('user_id, plan, plan_expires_at, users!user_id(phone)')
    .not('plan', 'eq', 'free')
    .not('plan_expires_at', 'is', null)
    .lte('plan_expires_at', threeDaysFromNow.toISOString())
    .gt('plan_expires_at', now.toISOString())

  if (soonError) {
    logger.error({ error: soonError }, 'Failed to fetch expiring plans')
    throw soonError
  }

  for (const profile of expiringSoon ?? []) {
    const user = profile.users as unknown as unknown as { phone: string } | null
    const expiresAt = new Date(profile.plan_expires_at!).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    if (user?.phone) {
      await sendSms({
        to: user.phone,
        message: smsTemplates.subscriptionRenewalReminder(profile.plan, expiresAt),
      })
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: profile.user_id,
      type: 'plan_expiry_reminder',
      title: 'Subscription Expiring Soon',
      body: smsTemplates.subscriptionRenewalReminder(profile.plan, expiresAt),
    })
  }

  // Find expired plans → downgrade to free
  const { data: expired, error: expiredError } = await supabaseAdmin
    .from('lister_profiles')
    .select('user_id, plan, users!user_id(phone)')
    .not('plan', 'eq', 'free')
    .not('plan_expires_at', 'is', null)
    .lte('plan_expires_at', now.toISOString())

  if (expiredError) {
    logger.error({ error: expiredError }, 'Failed to fetch expired plans')
    throw expiredError
  }

  for (const profile of expired ?? []) {
    const user = profile.users as unknown as unknown as { phone: string } | null

    await supabaseAdmin
      .from('lister_profiles')
      .update({ plan: 'free', plan_expires_at: null })
      .eq('user_id', profile.user_id)

    if (user?.phone) {
      await sendSms({
        to: user.phone,
        message: smsTemplates.planDowngraded(profile.plan),
      })
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: profile.user_id,
      type: 'plan_expired',
      title: 'Subscription Expired',
      body: smsTemplates.planDowngraded(profile.plan),
    })
  }

  logger.info(
    { reminders: expiringSoon?.length ?? 0, downgraded: expired?.length ?? 0 },
    'Plan expiry check complete'
  )
}
