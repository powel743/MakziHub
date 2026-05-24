import '@fastify/jwt'
import { JwtPayload } from '../middleware/requireAuth'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
  }
}
