import { FastifyRequest, FastifyReply } from 'fastify'
import { forbidden } from '../utils/errors'

export function requireRole(...roles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userRole = request.user?.role
    if (!userRole || !roles.includes(userRole)) {
      const err = forbidden(`This action requires role: ${roles.join(' or ')}`)
      reply.status(err.statusCode).send({ error: err.message, code: err.code })
    }
  }
}
