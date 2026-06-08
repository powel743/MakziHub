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

  /**
   * PATCH /v1/auth/me
   * Called by RoleSelectPage after OTP verification. Sets the user's role
   * and creates the appropriate profile row.
   *
   * BUG FIX: The original upsert for lister_profiles omitted `full_name`,
   * which is NOT NULL in the schema → PostgreSQL constraint violation → 500.
   * Fix: read full_name from the tenant_profile created during registration.
   */
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

    // Update the role on the users table
    const { error: roleError } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (roleError) {
      return reply.status(422).send({ error: roleError.message })
    }

    if (role === 'tenant') {
      // Ensure the tenant profile exists (it should already from registration)
      await supabaseAdmin
        .from('tenant_profiles')
        .upsert({ user_id: userId, free_credits: 3 }, { onConflict: 'user_id' })
    } else {
      // Lister role — we need full_name for the NOT NULL column.
      // It was stored on the tenant_profile created during registration.
      const { data: existing } = await supabaseAdmin
        .from('tenant_profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single()

      const fullName = existing?.full_name ?? 'Unknown'

      await supabaseAdmin
        .from('lister_profiles')
        .upsert(
          { user_id: userId, full_name: fullName, plan: 'free' },
          { onConflict: 'user_id' }
        )
    }

    return reply.send({ user: { id: userId, role } })
  })

  /**
   * GET /v1/auth/me
   * Returns the current user's profile (used after token refresh, etc.)
   */
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

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    // Attach the relevant profile
    let profile = null
    if (user.role === 'tenant') {
      const { data } = await supabaseAdmin
        .from('tenant_profiles')
        .select('full_name, free_credits, is_subscribed')
        .eq('user_id', userId)
        .single()
      profile = data
    } else if (['landlord', 'caretaker', 'agency'].includes(user.role)) {
      const { data } = await supabaseAdmin
        .from('lister_profiles')
        .select('full_name, plan, plan_expires_at, id_verified')
        .eq('user_id', userId)
        .single()
      profile = data
    }

    return reply.send({ user: { ...user, profile } })
  })
}
