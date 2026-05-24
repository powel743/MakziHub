import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import { unlockHandler, getInquiriesHandler } from './inquiries.controller'

export async function inquiriesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/unlock',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['inquiries'] } },
    unlockHandler
  )
  fastify.get(
    '/',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['inquiries'] } },
    getInquiriesHandler
  )
}
