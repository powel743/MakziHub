import Fastify, { FastifyInstance } from 'fastify'
import { AppError } from './utils/errors'
import logger from './utils/logger'

// Plugins
import authPlugin from './plugins/auth.plugin'
import corsPlugin from './plugins/cors.plugin'
import rateLimitPlugin from './plugins/rate-limit.plugin'
import multipartPlugin from './plugins/multipart.plugin'
import swaggerPlugin from './plugins/swagger.plugin'

// Routes
import { registerRoutes } from './routes/index'

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false, // We use pino directly
    trustProxy: true,
  })

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.code,
      })
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(422).send({
        error: error.message,
        code: 'VALIDATION_ERROR',
      })
    }

    logger.error(
      { err: error, method: request.method, url: request.url },
      'Unhandled error'
    )

    reply.status(500).send({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    })
  })

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: `Route ${request.method} ${request.url} not found`,
      code: 'NOT_FOUND',
    })
  })

  // Register plugins in order
  await fastify.register(corsPlugin)
  await fastify.register(swaggerPlugin)
  await fastify.register(authPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(multipartPlugin)

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }))

  // Register all routes under /v1
  fastify.register(
    async (v1) => {
      await registerRoutes(v1)
    },
    { prefix: '/v1' }
  )

  return fastify
}
