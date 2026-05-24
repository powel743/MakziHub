import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'
import logger from '../../utils/logger'

interface NewListingData {
  listingId: string
  estate: string
  bedrooms: number
  rentKsh: number
  houseType: string
}

export async function searchAlertMatcherProcessor(
  job: Job<NewListingData>
): Promise<void> {
  const { listingId, estate, bedrooms, rentKsh, houseType } = job.data

  logger.info({ listingId }, 'Matching new listing against search alerts')

  // Build query to find matching active alerts
  let query = supabaseAdmin
    .from('search_alerts')
    .select('id, tenant_user_id, estate, max_rent, bedrooms, house_type, users!tenant_user_id(phone)')
    .eq('active', true)

  // Match estate if specified in alert
  // We fetch all active alerts and filter in memory to handle NULL fields
  const { data: alerts, error } = await query

  if (error) {
    logger.error({ error }, 'Failed to fetch search alerts')
    throw error
  }

  if (!alerts || alerts.length === 0) return

  const matchingAlerts = alerts.filter((alert) => {
    if (alert.estate && alert.estate.toLowerCase() !== estate.toLowerCase()) return false
    if (alert.max_rent && rentKsh > alert.max_rent) return false
    if (alert.bedrooms && alert.bedrooms !== bedrooms) return false
    if (alert.house_type && alert.house_type !== houseType) return false
    return true
  })

  logger.info({ listingId, matchCount: matchingAlerts.length }, 'Matched search alerts')

  for (const alert of matchingAlerts) {
    const user = alert.users as unknown as unknown as { phone: string } | null
    if (!user?.phone) continue

    await sendSms({
      to: user.phone,
      message: smsTemplates.searchAlertMatch(bedrooms, estate, rentKsh, listingId),
    })

    // Create in-app notification
    await supabaseAdmin.from('notifications').insert({
      user_id: alert.tenant_user_id,
      type: 'search_alert_match',
      title: `New listing in ${estate}`,
      body: smsTemplates.searchAlertMatch(bedrooms, estate, rentKsh, listingId),
      metadata: { listing_id: listingId },
    })
  }
}
