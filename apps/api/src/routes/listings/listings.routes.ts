import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import { supabaseAdmin } from '../../config/supabase'
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

  // Lister: my listings
  fastify.get('/mine', {
    preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency')],
    schema: { tags: ['listings'] },
  }, async (request, reply) => {
    const userId = request.user.sub
    const { limit = 10, sort = 'created_at' } = request.query as { limit?: number; sort?: string }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('id, title, estate, rent_ksh, status, house_type, bedrooms, created_at, listing_photos(url, order)')
      .eq('lister_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Number(limit))

    if (error) return reply.status(422).send({ error: error.message })
    return reply.send({ data: data ?? [], total: data?.length ?? 0 })
  })

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
  fastify.post('/', {
    preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency')],
    schema: { tags: ['listings'] },
  }, createListingHandler)

  fastify.patch('/:id', {
    preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency', 'admin')],
    schema: { tags: ['listings'] },
  }, updateListingHandler)

  fastify.delete('/:id', {
    preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency', 'admin')],
    schema: { tags: ['listings'] },
  }, deleteListingHandler)

  fastify.post('/:id/photos', {
    preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency', 'admin')],
    schema: { tags: ['listings'], consumes: ['multipart/form-data'] },
  }, uploadPhotoHandler)

  fastify.delete('/:id/photos/:photo_id', {
    preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency', 'admin')],
    schema: { tags: ['listings'] },
  }, deletePhotoHandler)
}
