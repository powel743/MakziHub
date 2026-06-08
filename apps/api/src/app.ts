import Fastify, { FastifyInstance } from 'fastify'
import { AppError } from './utils/errors'
import { env } from './config/env'
import { supabaseAdmin } from './config/supabase'
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

  // Live sitemap — served at the API root (Cloudflare proxies
  // https://www.makazihub.co.ke/sitemap.xml -> here). Always fresh from the DB.
  fastify.get('/sitemap.xml', async (_request, reply) => {
    const base = env.FRONTEND_URL.replace(/\/$/, '')
    const [estatesRes, listingsRes, agenciesRes] = await Promise.all([
      supabaseAdmin.from('approved_estates').select('slug').eq('active', true),
      supabaseAdmin
        .from('listings')
        .select('id, updated_at')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(1000),
      supabaseAdmin.from('agencies').select('id').eq('verified', true),
    ])

    const urls: string[] = [
      `<url><loc>${base}/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>`,
      `<url><loc>${base}/listings</loc><priority>0.9</priority><changefreq>hourly</changefreq></url>`,
      ...(estatesRes.data ?? []).map(
        (e: { slug: string }) =>
          `<url><loc>${base}/estates/${e.slug}</loc><priority>0.8</priority><changefreq>daily</changefreq></url>`
      ),
      ...(listingsRes.data ?? []).map((l: { id: string; updated_at: string }) => {
        const lastmod = new Date(l.updated_at).toISOString()
        return `<url><loc>${base}/listings/${l.id}</loc><lastmod>${lastmod}</lastmod><priority>0.7</priority><changefreq>weekly</changefreq></url>`
      }),
      ...(agenciesRes.data ?? []).map(
        (a: { id: string }) =>
          `<url><loc>${base}/agencies/${a.id}</loc><priority>0.6</priority><changefreq>weekly</changefreq></url>`
      ),
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
    reply.header('Content-Type', 'application/xml').send(xml)
  })

  // Register all routes under /v1
  fastify.register(
    async (v1) => {
      await registerRoutes(v1)
    },
    { prefix: '/v1' }
  )

  return fastify
}
