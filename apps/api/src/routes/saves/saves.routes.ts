import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import { getSavedListingsHandler } from './saves.controller'

export async function savesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['saves'] } },
    getSavedListingsHandler
  )
}
