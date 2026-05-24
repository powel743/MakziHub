import { FastifyInstance } from 'fastify'
import {
  registerHandler,
  verifyOtpHandler,
  loginHandler,
  refreshHandler,
  forgotPasswordHandler,
} from './auth.controller'
import { requireAuth } from '../../middleware/requireAuth'
import { supabaseAdmin } from '../../config/supabase'

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/register', { schema: { tags: ['auth'] } }, registerHandler)
  fastify.post('/verify-otp', { schema: { tags: ['auth'] } }, verifyOtpHandler)
  fastify.post('/login', { schema: { tags: ['auth'] } }, loginHandler)
  fastify.post('/refresh', { schema: { tags: ['auth'] } }, refreshHandler)
  fastify.post('/forgot-password', { schema: { tags: ['auth'] } }, forgotPasswordHandler)

  // Update user role after OTP verification
  fastify.patch('/me', {
    schema: { tags: ['auth'] },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { role } = request.body as { role: string }
    const userId = request.user.sub

    const validRoles = ['tenant', 'landlord', 'caretaker', 'agency']
    if (!validRoles.includes(role)) {
      return reply.status(400).send({ error: 'Invalid role' })
    }

    await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)

    // Create profile if not exists
    if (role === 'tenant') {
      await supabaseAdmin
        .from('tenant_profiles')
        .upsert({ user_id: userId, free_credits: 3 }, { onConflict: 'user_id' })
    } else {
      await supabaseAdmin
        .from('lister_profiles')
        .upsert({ user_id: userId, plan: 'free' }, { onConflict: 'user_id' })
    }

    return reply.send({ user: { id: userId, role } })
  })

  // Get current user profile
  fastify.get('/me', {
    schema: { tags: ['auth'] },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const userId = request.user.sub

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, phone, role, verified_phone')
      .eq('id', userId)
      .single()

    return reply.send({ user })
  })
}
