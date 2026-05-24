import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'
import logger from '../../utils/logger'

export async function fraudAggregatorProcessor(job: Job<{ listingId: string }>): Promise<void> {
  const { listingId } = job.data

  // Count unresolved fraud reports for this listing
  const { count, error: countError } = await supabaseAdmin
    .from('fraud_reports')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', listingId)
    .eq('resolved', false)

  if (countError) {
    logger.error({ error: countError }, 'Failed to count fraud reports')
    throw countError
  }

  if ((count ?? 0) < 3) {
    logger.info({ listingId, count }, 'Fraud report count below threshold, no action')
    return
  }

  logger.warn({ listingId, count }, 'Fraud threshold reached — suspending listing')

  // Suspend the listing
  const { data: listing, error: suspendError } = await supabaseAdmin
    .from('listings')
    .update({ status: 'suspended' })
    .eq('id', listingId)
    .select('estate')
    .single()

  if (suspendError) {
    logger.error({ error: suspendError }, 'Failed to suspend listing')
    throw suspendError
  }

  // Auto-refund tenants who unlocked this listing in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentInquiries, error: inquiryError } = await supabaseAdmin
    .from('inquiries')
    .select('id, tenant_user_id, users!tenant_user_id(phone)')
    .eq('listing_id', listingId)
    .eq('refunded', false)
    .gte('unlocked_at', sevenDaysAgo)

  if (inquiryError) {
    logger.error({ error: inquiryError }, 'Failed to fetch recent inquiries for refund')
    throw inquiryError
  }

  if (recentInquiries && recentInquiries.length > 0) {
    for (const inquiry of recentInquiries) {
      // Issue credit refund to tenant
      const user = inquiry.users as { phone: string } | null

      // Increment tenant's free_credits by 1
      const { data: profile } = await supabaseAdmin
        .from('tenant_profiles')
        .select('free_credits')
        .eq('user_id', inquiry.tenant_user_id)
        .single()

      const newCredits = (profile?.free_credits ?? 0) + 1

      await supabaseAdmin
        .from('tenant_profiles')
        .update({ free_credits: newCredits })
        .eq('user_id', inquiry.tenant_user_id)

      await supabaseAdmin
        .from('inquiries')
        .update({ refunded: true })
        .eq('id', inquiry.id)

      // Notify tenant via in-app notification
      await supabaseAdmin.from('notifications').insert({
        user_id: inquiry.tenant_user_id,
        type: 'fraud_refund',
        title: 'Unlock Fee Refunded',
        body: smsTemplates.fraudAutoRefund(listing?.estate ?? 'the property', newCredits),
      })

      if (user?.phone) {
        await sendSms({
          to: user.phone,
          message: smsTemplates.fraudAutoRefund(listing?.estate ?? 'the property', newCredits),
        })
      }
    }

    logger.info({ count: recentInquiries.length }, 'Auto-refunded tenants for suspended listing')
  }

  // Notify admin
  await supabaseAdmin.from('notifications').insert({
    user_id: '00000000-0000-0000-0000-000000000000', // Placeholder admin user
    type: 'fraud_suspension',
    title: 'Listing Auto-Suspended',
    body: `Listing ${listingId} at ${listing?.estate} was suspended due to ${count} fraud reports.`,
  })
}
