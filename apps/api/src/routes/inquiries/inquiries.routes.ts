import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireRole } from '../../middleware/requireRole'
import { unlockHandler, getInquiriesHandler } from './inquiries.controller'
import { supabaseAdmin } from '../../config/supabase'
import { maskPhone } from '../../utils/mask'

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
  // BUG FIX: Supabase PostgREST does NOT support filtering on embedded/joined table
  // columns via plain .eq('relation.column', value) without an !inner join.
  // The original .eq('listings.lister_user_id', userId) was silently ignored,
  // returning ALL inquiries. Fix: resolve listing IDs first, then filter.
  fastify.get(
    '/received',
    {
      preHandler: [requireAuth, requireRole('landlord', 'caretaker', 'agency')],
      schema: { tags: ['inquiries'] },
    },
    async (request, reply) => {
      const userId = request.user.sub
      const { limit = 10, page = 1 } = request.query as { limit?: number; page?: number }

      // Step 1 — get the IDs of listings owned by this lister
      const { data: ownedListings, error: listingsError } = await supabaseAdmin
        .from('listings')
        .select('id')
        .eq('lister_user_id', userId)

      if (listingsError) {
        return reply.status(422).send({ error: listingsError.message })
      }

      const listingIds = ownedListings?.map((l) => l.id) ?? []

      if (listingIds.length === 0) {
        return reply.send({ data: [], total: 0 })
      }

      // Step 2 — fetch unlocked inquiries for those listings
      const { data, error, count } = await supabaseAdmin
        .from('inquiries')
        .select(
          `id, unlocked_at, created_at,
           listings!listing_id(id, title, estate, rent_ksh),
           users!tenant_user_id(id, email, phone)`,
          { count: 'exact' }
        )
        .in('listing_id', listingIds)
        .not('unlocked_at', 'is', null)
        .order('unlocked_at', { ascending: false })
        .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1)

      if (error) return reply.status(422).send({ error: error.message })

      // Flatten the nested listing/user objects for frontend convenience
      const normalised = (data ?? []).map((inq) => {
        const listing = Array.isArray(inq.listings) ? inq.listings[0] : inq.listings
        const tenant = Array.isArray(inq.users) ? inq.users[0] : inq.users
        return {
          id: inq.id,
          unlocked_at: inq.unlocked_at,
          created_at: inq.created_at,
          listing_id: (listing as any)?.id,
          listing_title: (listing as any)?.title,
          listing_estate: (listing as any)?.estate,
          listing_rent_ksh: (listing as any)?.rent_ksh,
          tenant_email: (tenant as any)?.email,
          // Mask the tenant's phone in the lister-facing inbox (PRD §6.3).
          // The admin endpoint returns the full number.
          tenant_phone: maskPhone((tenant as any)?.phone),
        }
      })

      return reply.send({ data: normalised, total: count ?? 0 })
    }
  )
}
