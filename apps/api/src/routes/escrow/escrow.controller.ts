import { FastifyRequest, FastifyReply } from 'fastify'
import { isEnabled } from '../../utils/featureFlags'

const ESCROW_DISABLED = {
  error: 'Escrow is not available yet',
  code: 'ESCROW_DISABLED',
}

// When the flag is off (default), escrow endpoints are not exposed → 403.
// When turned on (Phase 2, month 7+), the real implementation lands here.
function escrowGuard(reply: FastifyReply): boolean {
  if (!isEnabled('FEATURE_ESCROW')) {
    reply.status(403).send(ESCROW_DISABLED)
    return false
  }
  return true
}

export async function depositHandler(_request: FastifyRequest, reply: FastifyReply) {
  if (!escrowGuard(reply)) return
  reply.status(501).send({ error: 'Not yet implemented — Phase 2', code: 'ESCROW_NOT_IMPLEMENTED' })
}

export async function confirmHandler(_request: FastifyRequest, reply: FastifyReply) {
  if (!escrowGuard(reply)) return
  reply.status(501).send({ error: 'Not yet implemented — Phase 2', code: 'ESCROW_NOT_IMPLEMENTED' })
}

export async function refundHandler(_request: FastifyRequest, reply: FastifyReply) {
  if (!escrowGuard(reply)) return
  reply.status(501).send({ error: 'Not yet implemented — Phase 2', code: 'ESCROW_NOT_IMPLEMENTED' })
}
