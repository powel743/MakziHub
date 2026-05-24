import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import {
  createReviewHandler,
  getListingReviewsHandler,
  deleteReviewHandler,
} from './reviews.controller'

export async function reviewsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/listing/:listing_id',
    { schema: { tags: ['reviews'] } },
    getListingReviewsHandler
  )
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['reviews'] } },
    createReviewHandler
  )
  fastify.delete(
    '/:id',
    { preHandler: [requireAuth], schema: { tags: ['reviews'] } },
    deleteReviewHandler
  )
}
