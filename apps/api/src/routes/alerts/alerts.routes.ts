import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import {
  createAlertHandler,
  getUserAlertsHandler,
  deleteAlertHandler,
  toggleAlertHandler,
} from './alerts.controller'

export async function alertsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['alerts'] } },
    createAlertHandler
  )
  fastify.get(
    '/',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['alerts'] } },
    getUserAlertsHandler
  )
  fastify.delete(
    '/:id',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['alerts'] } },
    deleteAlertHandler
  )
  fastify.patch(
    '/:id/toggle',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['alerts'] } },
    toggleAlertHandler
  )
}
