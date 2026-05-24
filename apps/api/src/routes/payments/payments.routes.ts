import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import {
  mpesaCallbackHandler,
  buyCreditsHandler,
  buySubscriptionHandler,
} from './payments.controller'

export async function paymentsRoutes(fastify: FastifyInstance): Promise<void> {
  // M-Pesa Daraja callback — no auth, public endpoint
  fastify.post(
    '/mpesa/callback',
    { schema: { tags: ['payments'] } },
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
