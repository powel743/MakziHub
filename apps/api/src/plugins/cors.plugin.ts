import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import { FastifyInstance } from 'fastify'
import { env } from '../config/env'

async function corsPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyCors, {
    // Explicit allow-list — no wildcard in production.
    origin: [
      env.FRONTEND_URL,
      'https://www.makazihub.co.ke',
      'https://makazihub.co.ke',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
}

export default fp(corsPlugin, { name: 'cors-plugin' })
