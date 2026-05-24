import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import {
  getNotificationsHandler,
  markReadHandler,
  markAllReadHandler,
} from './notifications.controller'

export async function notificationsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    { preHandler: [requireAuth], schema: { tags: ['notifications'] } },
    getNotificationsHandler
  )
  fastify.patch(
    '/:id/read',
    { preHandler: [requireAuth], schema: { tags: ['notifications'] } },
    markReadHandler
  )
  fastify.post(
    '/mark-all-read',
    { preHandler: [requireAuth], schema: { tags: ['notifications'] } },
    markAllReadHandler
  )
}
