import { FastifyInstance } from 'fastify'
import {
  registerHandler,
  verifyOtpHandler,
  loginHandler,
  refreshHandler,
  forgotPasswordHandler,
} from './auth.controller'

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/register', { schema: { tags: ['auth'] } }, registerHandler)
  fastify.post('/verify-otp', { schema: { tags: ['auth'] } }, verifyOtpHandler)
  fastify.post('/login', { schema: { tags: ['auth'] } }, loginHandler)
  fastify.post('/refresh', { schema: { tags: ['auth'] } }, refreshHandler)
  fastify.post('/forgot-password', { schema: { tags: ['auth'] } }, forgotPasswordHandler)
}
