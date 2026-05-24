import fp from 'fastify-plugin'
import fastifyMultipart from '@fastify/multipart'
import { FastifyInstance } from 'fastify'

async function multipartPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 1024 * 1024, // 1MB per field
      fields: 20,
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 10, // max 10 photos
      headerPairs: 2000,
    },
  })
}

export default fp(multipartPlugin, { name: 'multipart-plugin' })
