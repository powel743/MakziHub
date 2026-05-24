import { FastifyRequest, FastifyReply } from 'fastify'
import { unauthorized } from '../utils/errors'

export interface JwtPayload {
  sub: string
  email: string
  role: string
  plan?: string
  iat?: number
  exp?: number
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    const err = unauthorized('Authentication required')
    reply.status(err.statusCode).send({ error: err.message, code: err.code })
  }
}
