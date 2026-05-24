import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { getUserReportsHandler } from './reports.controller'

export async function reportsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    { preHandler: [requireAuth], schema: { tags: ['reports'] } },
    getUserReportsHandler
  )
}
