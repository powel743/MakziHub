import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import { unlockHandler, getInquiriesHandler } from './inquiries.controller'
import { supabaseAdmin } from '../../config/supabase'

export async function inquiriesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/unlock',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['inquiries'] } },
    unlockHandler
  )

  fastify.get(
    '/',
    { preHandler: [requireAuth, requireRole('tenant')], schema: { tags: ['inquiries'] } },
    getInquiriesHandler
  )

  // Lister received inquiries
  fastify.get(
    '/received',
    { preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency')], schema: { tags: ['inquiries'] } },
    async (request, reply) => {
      const userId = request.user.sub
      const { limit = 10, page = 1 } = request.query as { limit?: number; page?: number }

      const { data, error } = await supabaseAdmin
        .from('inquiries')
        .select(`
          id, unlocked_at, created_at,
          listings!listing_id(id, title, estate, rent_ksh),
          users!tenant_user_id(id, email, phone)
        `)
        .eq('listings.lister_user_id', userId)
        .not('unlocked_at', 'is', null)
        .order('unlocked_at', { ascending: false })
        .limit(Number(limit))

      if (error) return reply.status(422).send({ error: error.message })
      return reply.send({ data: data ?? [], total: data?.length ?? 0 })
    }
  )
}
