import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import {
  getModerationQueueHandler,
  adminUpdateListingHandler,
  searchUsersHandler,
  adminUpdateUserHandler,
  getFraudReportsHandler,
  resolveFraudReportHandler,
  getRevenueReportHandler,
} from './admin.controller'

const adminGuard = [requireAuth, requireRole('admin')]

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/listings',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    getModerationQueueHandler
  )
  fastify.patch(
    '/listings/:id',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    adminUpdateListingHandler
  )
  fastify.get(
    '/users',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    searchUsersHandler
  )
  fastify.patch(
    '/users/:id',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    adminUpdateUserHandler
  )
  fastify.get(
    '/fraud-reports',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    getFraudReportsHandler
  )
  fastify.patch(
    '/fraud-reports/:id',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    resolveFraudReportHandler
  )
  fastify.get(
    '/revenue',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    getRevenueReportHandler
  )
}
