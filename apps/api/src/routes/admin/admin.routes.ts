import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import {
  getAdminStatsHandler,
  getModerationQueueHandler,
  adminUpdateListingHandler,
  searchUsersHandler,
  adminUpdateUserHandler,
  getFraudReportsHandler,
  resolveFraudReportHandler,
  getRevenueReportHandler,
  getVerificationsHandler,
  approveVerificationHandler,
  rejectVerificationHandler,
  getEstateHandler,
  updateEstateHandler,
} from './admin.controller'

const adminGuard = [requireAuth, requireRole('admin')]

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/dashboard',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    getAdminStatsHandler
  )
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

  // Lister ID-verification review queue
  fastify.get(
    '/verifications',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    getVerificationsHandler
  )
  fastify.post(
    '/verifications/:id/approve',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    approveVerificationHandler
  )
  fastify.post(
    '/verifications/:id/reject',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    rejectVerificationHandler
  )

  // Estate SEO content editor
  fastify.get(
    '/estates/:id',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    getEstateHandler
  )
  fastify.patch(
    '/estates/:id',
    { preHandler: adminGuard, schema: { tags: ['admin'] } },
    updateEstateHandler
  )
}
