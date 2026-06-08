import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import {
  createAgencyHandler,
  getAgencyHandler,
  inviteMemberHandler,
  getMembersHandler,
  importPreviewHandler,
  importConfirmHandler,
} from './agencies.controller'

export async function agenciesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/:id', { schema: { tags: ['agencies'] } }, getAgencyHandler)

  fastify.post(
    '/',
    { preHandler: [requireAuth, requireRole('agency')], schema: { tags: ['agencies'] } },
    createAgencyHandler
  )
  fastify.get(
    '/:id/members',
    { preHandler: [requireAuth, requireRole('agency')], schema: { tags: ['agencies'] } },
    getMembersHandler
  )
  fastify.post(
    '/:id/members',
    { preHandler: [requireAuth, requireRole('agency')], schema: { tags: ['agencies'] } },
    inviteMemberHandler
  )
  fastify.post(
    '/:id/import',
    {
      preHandler: [requireAuth, requireRole('agency')],
      schema: { tags: ['agencies'], consumes: ['multipart/form-data'] },
    },
    importPreviewHandler
  )
  fastify.post(
    '/:id/import/confirm',
    { preHandler: [requireAuth, requireRole('agency')], schema: { tags: ['agencies'] } },
    importConfirmHandler
  )
}
