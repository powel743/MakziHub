import { Queue } from 'bullmq'
import { redis } from '../config/redis'

const connection = { connection: redis }

// One queue per job type. This keeps retry/concurrency settings isolated per
// concern and means every queue has exactly one dedicated Worker (see worker.ts),
// so there is never ambiguity about which processor handles a given job.
export const listingExpiryQueue = new Queue('listing-expiry', connection)
export const fraudAggregatorQueue = new Queue('fraud-aggregator', connection)
export const fraudRefundQueue = new Queue('fraud-refund', connection)
export const alertQueue = new Queue('alert', connection)
export const paymentTimeoutQueue = new Queue('payment-timeout', connection)
export const planExpiryQueue = new Queue('plan-expiry', connection)
export const sitemapQueue = new Queue('sitemap', connection)
export const importQueue = new Queue('import', connection)
export const escrowQueue = new Queue('escrow', connection)

export type ListingExpiryJobName = 'listing-expiry-check'
export type FraudAggregatorJobName = 'fraud-report-aggregator'
export type FraudRefundJobName = 'fraud-refund-check'
export type AlertJobName = 'search-alert-matcher'
export type PaymentTimeoutJobName = 'payment-timeout'
export type PlanJobName = 'plan-expiry-check'
export type SitemapJobName = 'sitemap-generator'
export type ImportJobName = 'csv-import-processor'
export type EscrowJobName = 'escrow-auto-refund'

export const queues = {
  'listing-expiry': listingExpiryQueue,
  'fraud-aggregator': fraudAggregatorQueue,
  'fraud-refund': fraudRefundQueue,
  alert: alertQueue,
  'payment-timeout': paymentTimeoutQueue,
  'plan-expiry': planExpiryQueue,
  sitemap: sitemapQueue,
  import: importQueue,
  escrow: escrowQueue,
}
