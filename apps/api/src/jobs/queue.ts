import { Queue } from 'bullmq'
import { redis } from '../config/redis'

const connection = { connection: redis }

export const listingQueue = new Queue('listing', connection)
export const paymentQueue = new Queue('payment', connection)
export const alertQueue = new Queue('alert', connection)
export const sitemapQueue = new Queue('sitemap', connection)
export const importQueue = new Queue('import', connection)
export const escrowQueue = new Queue('escrow', connection)

export type ListingJobName =
  | 'listing-expiry-check'
  | 'fraud-report-aggregator'
  | 'search-alert-matcher'

export type PaymentJobName = 'payment-timeout'
export type SitemapJobName = 'sitemap-generator'
export type ImportJobName = 'csv-import-processor'
export type EscrowJobName = 'escrow-auto-refund'
export type PlanJobName = 'plan-expiry-check'

export const queues = {
  listing: listingQueue,
  payment: paymentQueue,
  alert: alertQueue,
  sitemap: sitemapQueue,
  import: importQueue,
  escrow: escrowQueue,
}
