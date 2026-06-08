import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import { uploadVerificationHandler, verificationStatusHandler } from './verification.controller'

const LISTER_ROLES = ['landlord', 'caretaker', 'agency'] as const

export async function verificationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/upload',
    {
      preHandler: [requireAuth, requireRole(...LISTER_ROLES)],
      schema: { tags: ['verification'], consumes: ['multipart/form-data'] },
    },
    uploadVerificationHandler
  )

  fastify.get(
    '/',
    {
      preHandler: [requireAuth, requireRole(...LISTER_ROLES)],
      schema: { tags: ['verification'] },
    },
    verificationStatusHandler
  )
}
