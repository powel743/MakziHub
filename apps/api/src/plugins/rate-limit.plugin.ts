import fp from 'fastify-plugin'
import fastifyRateLimit from '@fastify/rate-limit'
import { FastifyInstance } from 'fastify'
import { redis } from '../config/redis'

async function rateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) => {
      // Use authenticated user ID if available, else IP
      const userId = (request as { user?: { sub?: string } }).user?.sub
      return userId ?? request.ip
    },
    errorResponseBuilder: () => ({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
    }),
  })
}

export default fp(rateLimitPlugin, { name: 'rate-limit-plugin' })
