import { FastifyRequest, FastifyReply } from 'fastify'
import { forbidden } from '../utils/errors'
import { supabaseAdmin } from '../config/supabase'

const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  pro: 1,
  business: 2,
}

export function requirePlan(minimumPlan: 'pro' | 'business') {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.sub
    if (!userId) {
      const err = forbidden('Authentication required')
      return reply.status(err.statusCode).send({ error: err.message, code: err.code })
    }

    const { data: profile } = await supabaseAdmin
      .from('lister_profiles')
      .select('plan, plan_expires_at')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      const err = forbidden('Lister profile not found')
      return reply.status(err.statusCode).send({ error: err.message, code: err.code })
    }

    // Check if plan is expired
    if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
      const err = forbidden('Your subscription has expired. Please renew to access this feature.')
      return reply.status(err.statusCode).send({ error: err.message, code: err.code })
    }

    const userPlanLevel = PLAN_HIERARCHY[profile.plan] ?? 0
    const requiredLevel = PLAN_HIERARCHY[minimumPlan] ?? 0

    if (userPlanLevel < requiredLevel) {
      const err = forbidden(
        `This feature requires the ${minimumPlan} plan. Please upgrade at makazihub.co.ke/lister/billing`
      )
      return reply.status(err.statusCode).send({ error: err.message, code: err.code })
    }
  }
}
