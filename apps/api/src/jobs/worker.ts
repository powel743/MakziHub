import { Worker } from 'bullmq'
import { redis } from '../config/redis'
import logger from '../utils/logger'

import { listingExpiryProcessor } from './processors/listingExpiry.processor'
import { fraudAggregatorProcessor } from './processors/fraudAggregator.processor'
import { fraudRefundCheckProcessor } from './processors/fraudRefundCheck.processor'
import { searchAlertMatcherProcessor } from './processors/searchAlertMatcher.processor'
import { paymentTimeoutProcessor } from './processors/paymentTimeout.processor'
import { planExpiryProcessor } from './processors/planExpiry.processor'
import { sitemapGeneratorProcessor } from './processors/sitemapGenerator.processor'
import { csvImportProcessor } from './processors/csvImport.processor'
import { escrowAutoRefundProcessor } from './processors/escrowAutoRefund.processor'

// BullMQ Workers need their own connection (they issue blocking commands), so we
// duplicate the shared ioredis client rather than reuse it directly.
const connection = redis.duplicate()
const workerOpts = { connection }

const workers: Worker[] = []

function attachListeners(worker: Worker): Worker {
  worker.on('failed', (job, err) =>
    logger.error(
      { queue: worker.name, jobId: job?.id, jobName: job?.name, err },
      'Job failed'
    )
  )
  worker.on('error', (err) => logger.error({ queue: worker.name, err }, 'Worker error'))
  worker.on('completed', (job) =>
    logger.info({ queue: worker.name, jobId: job.id, jobName: job.name }, 'Job completed')
  )
  workers.push(worker)
  return worker
}

// One Worker per queue — queue names must match jobs/queue.ts exactly.
export function startWorkers(): void {
  attachListeners(new Worker('listing-expiry', listingExpiryProcessor, workerOpts))
  attachListeners(new Worker('fraud-aggregator', fraudAggregatorProcessor, workerOpts))
  attachListeners(new Worker('fraud-refund', fraudRefundCheckProcessor, workerOpts))
  attachListeners(new Worker('alert', searchAlertMatcherProcessor, workerOpts))
  attachListeners(new Worker('payment-timeout', paymentTimeoutProcessor, workerOpts))
  attachListeners(new Worker('plan-expiry', planExpiryProcessor, workerOpts))
  attachListeners(new Worker('sitemap', sitemapGeneratorProcessor, workerOpts))
  attachListeners(new Worker('import', csvImportProcessor, workerOpts))
  attachListeners(new Worker('escrow', escrowAutoRefundProcessor, workerOpts))

  logger.info({ count: workers.length }, 'BullMQ workers started')
}

export async function stopWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()))
  logger.info('BullMQ workers stopped')
}
