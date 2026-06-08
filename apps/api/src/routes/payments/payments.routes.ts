import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { env } from '../../config/env'
import logger from '../../utils/logger'
import {
  mpesaCallbackHandler,
  buyCreditsHandler,
  buySubscriptionHandler,
} from './payments.controller'

// Safaricom Daraja callback source IPs (production). The /24 covers the
// documented gateway range; the explicit hosts are belt-and-suspenders.
const SAFARICOM_IPS = new Set(['196.201.214.200', '196.201.214.206'])
function isSafaricomIp(ip: string): boolean {
  const clean = ip.replace('::ffff:', '')
  return SAFARICOM_IPS.has(clean) || clean.startsWith('196.201.214.')
}

// The callback is a public webhook (no JWT), so authenticate it by source IP.
async function mpesaIpAllowlist(request: FastifyRequest, reply: FastifyReply) {
  const fwd = (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
  const ip = fwd || request.ip

  if (env.MPESA_ENV !== 'production') {
    if (!isSafaricomIp(ip)) {
      logger.warn({ ip }, 'M-Pesa callback from non-Safaricom IP (allowed in sandbox/dev)')
    }
    return
  }

  if (!isSafaricomIp(ip)) {
    logger.warn({ ip }, 'Rejected M-Pesa callback from non-Safaricom IP')
    return reply.status(403).send({ error: 'Forbidden' })
  }
}

export async function paymentsRoutes(fastify: FastifyInstance): Promise<void> {
  // M-Pesa Daraja callback — no JWT; authenticated by Safaricom IP allowlist
  fastify.post(
    '/mpesa/callback',
    { preHandler: [mpesaIpAllowlist], schema: { tags: ['payments'] } },
    mpesaCallbackHandler
  )

  // Authenticated payment initiation
  fastify.post(
    '/credits/buy',
    { preHandler: [requireAuth], schema: { tags: ['payments'] } },
    buyCreditsHandler
  )
  fastify.post(
    '/subscription',
    { preHandler: [requireAuth], schema: { tags: ['payments'] } },
    buySubscriptionHandler
  )
}
