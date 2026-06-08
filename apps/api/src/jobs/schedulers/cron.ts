import { listingExpiryQueue, planExpiryQueue, sitemapQueue } from '../queue'
import logger from '../../utils/logger'

// EAT is UTC+3 — cron expressions are in UTC
// 2am EAT = 23:00 UTC previous day
// 3am EAT = 00:00 UTC
// 1am EAT = 22:00 UTC previous day

export async function registerCronJobs(): Promise<void> {
  // listing-expiry-check — daily at 2am EAT (23:00 UTC)
  await listingExpiryQueue.add(
    'listing-expiry-check',
    {},
    {
      repeat: { pattern: '0 23 * * *' },
      jobId: 'cron:listing-expiry-check',
    }
  )

  // sitemap-generator — daily at 3am EAT (00:00 UTC)
  await sitemapQueue.add(
    'sitemap-generator',
    {},
    {
      repeat: { pattern: '0 0 * * *' },
      jobId: 'cron:sitemap-generator',
    }
  )

  // plan-expiry-check — daily at 1am EAT (22:00 UTC)
  await planExpiryQueue.add(
    'plan-expiry-check',
    {},
    {
      repeat: { pattern: '0 22 * * *' },
      jobId: 'cron:plan-expiry-check',
    }
  )

  logger.info('Cron jobs registered: listing-expiry-check, sitemap-generator, plan-expiry-check')
}
