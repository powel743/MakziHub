import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import {
  getListingsHandler,
  getListingByIdHandler,
  createListingHandler,
  updateListingHandler,
  deleteListingHandler,
  uploadPhotoHandler,
  deletePhotoHandler,
  toggleSaveHandler,
  reportListingHandler,
} from './listings.controller'

export async function listingsRoutes(fastify: FastifyInstance): Promise<void> {
  // Public routes
  fastify.get('/', { schema: { tags: ['listings'] } }, getListingsHandler)
  fastify.get('/:id', { schema: { tags: ['listings'] } }, getListingByIdHandler)

  // Authenticated tenant routes
  fastify.post(
    '/:id/save',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['listings'] } },
    toggleSaveHandler
  )
  fastify.post(
    '/:id/report',
    { preHandler: [requireAuth], schema: { tags: ['listings'] } },
    reportListingHandler
  )

  // Lister-only routes
  fastify.post(
    '/',
    {
      preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency')],
      schema: { tags: ['listings'] },
    },
    createListingHandler
  )
  fastify.patch(
    '/:id',
    {
      preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency', 'admin')],
      schema: { tags: ['listings'] },
    },
    updateListingHandler
  )
  fastify.delete(
    '/:id',
    {
      preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency', 'admin')],
      schema: { tags: ['listings'] },
    },
    deleteListingHandler
  )

  // Photo management
  fastify.post(
    '/:id/photos',
    {
      preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency', 'admin')],
      schema: { tags: ['listings'], consumes: ['multipart/form-data'] },
    },
    uploadPhotoHandler
  )
  fastify.delete(
    '/:id/photos/:photo_id',
    {
      preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency', 'admin')],
      schema: { tags: ['listings'] },
    },
    deletePhotoHandler
  )
}
