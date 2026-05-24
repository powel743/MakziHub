import { Job } from 'bullmq'
import logger from '../../utils/logger'

// Phase 2 stub — escrow auto-refund processor
// This processor is not active until FEATURE_ESCROW=true (Month 7+)
export async function escrowAutoRefundProcessor(job: Job): Promise<void> {
  logger.info({ jobId: job.id }, 'Escrow processor not yet active — Phase 2')
  // No-op intentionally. Full implementation will be added in Phase 2.
}
