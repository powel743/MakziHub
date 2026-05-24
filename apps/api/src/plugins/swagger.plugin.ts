import fp from 'fastify-plugin'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { FastifyInstance } from 'fastify'

async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'MakaziHub API',
        description: 'Kenya\'s dedicated rental housing marketplace API',
        version: '1.0.0',
        contact: {
          email: 'dev@makazihub.co.ke',
        },
      },
      servers: [
        { url: 'https://api.makazihub.co.ke/v1', description: 'Production' },
        { url: 'http://localhost:3000/v1', description: 'Local development' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'auth', description: 'Authentication & registration' },
        { name: 'listings', description: 'Rental listings' },
        { name: 'inquiries', description: 'Tenant unlock & inquiry history' },
        { name: 'payments', description: 'M-Pesa payments & callbacks' },
        { name: 'reviews', description: 'Listing reviews' },
        { name: 'agencies', description: 'Property management agencies' },
        { name: 'alerts', description: 'Tenant search alerts' },
        { name: 'saves', description: 'Saved listings' },
        { name: 'reports', description: 'Fraud reports' },
        { name: 'notifications', description: 'In-app notifications' },
        { name: 'admin', description: 'Admin moderation & management' },
        { name: 'escrow', description: 'Deposit escrow (Phase 2)' },
      ],
    },
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  })
}

export default fp(swaggerPlugin, { name: 'swagger-plugin' })
