import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { depositHandler, confirmHandler, refundHandler } from './escrow.controller'

export async function escrowRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/deposit',
    { preHandler: [requireAuth], schema: { tags: ['escrow'] } },
    depositHandler
  )
  fastify.post(
    '/:id/confirm',
    { preHandler: [requireAuth], schema: { tags: ['escrow'] } },
    confirmHandler
  )
  fastify.post(
    '/:id/refund',
    { preHandler: [requireAuth], schema: { tags: ['escrow'] } },
    refundHandler
  )
}
