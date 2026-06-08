import { FastifyInstance } from 'fastify'
import { supabaseAdmin } from '../../config/supabase'
import { notFound } from '../../utils/errors'

/**
 * Public estate landing-page data. The :identifier may be a slug ("ngong-road")
 * or an estate name ("Ngong Road") so it works regardless of how the link was built.
 */
export async function estatesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/:identifier', { schema: { tags: ['estates'] } }, async (request, reply) => {
    const { identifier } = request.params as { identifier: string }

    const { data: estate } = await supabaseAdmin
      .from('approved_estates')
      .select('id, name, slug, description, transport_links, nearby_schools, seo_meta_description')
      .or(`slug.eq.${identifier},name.ilike.${identifier}`)
      .maybeSingle()

    if (!estate) throw notFound('Estate not found')

    return reply.send(estate)
  })
}
