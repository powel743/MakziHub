import { FastifyRequest, FastifyReply } from 'fastify'
import { getUserReports } from './reports.service'

export async function getUserReportsHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await getUserReports(request.user.sub)
  reply.send({ reports: result })
}
