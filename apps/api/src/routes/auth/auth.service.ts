import { FastifyInstance } from 'fastify'
import { supabase, supabaseAdmin } from '../../config/supabase'
import { sendOtp, verifyOtp as checkOtp } from '../../services/africasTalking.service'
import { conflict, unauthorized, unprocessable } from '../../utils/errors'
import type { RegisterInput, LoginInput, VerifyOtpInput } from './auth.schema'

export async function registerUser(input: RegisterInput) {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .or(`email.eq.${input.email},phone.eq.${input.phone}`)
    .maybeSingle()

  if (existing) throw conflict('Email or phone already registered')

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    throw unprocessable(authError?.message ?? 'Failed to create auth user')
  }

  const userId = authData.user.id

  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: userId,
    email: input.email,
    phone: input.phone,
    // Always start as 'tenant'; role is updated after OTP via PATCH /auth/me
    role: 'tenant',
    verified_phone: false,
  })

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw unprocessable(userError.message)
  }

  // Always create a tenant_profile on registration so the OTP flow has a
  // full_name to fall back on. If the user later picks a lister role,
  // PATCH /auth/me creates the lister_profile using full_name from here.
  await supabaseAdmin.from('tenant_profiles').insert({
    user_id: userId,
    full_name: input.full_name,
    free_credits: 3,
  })

  await sendOtp({ phone: input.phone, email: input.email })

  return { user_id: userId, email: input.email, role: 'tenant' }
}

export async function verifyOtpAndLogin(
  input: VerifyOtpInput,
  fastifyInstance: FastifyInstance
) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('phone', input.phone)
    .single()

  if (!user) throw unauthorized('Phone number not found')

  const valid = await checkOtp(input.phone, input.otp)
  if (!valid) throw unauthorized('Invalid or expired OTP')

  await supabaseAdmin
    .from('users')
    .update({ verified_phone: true })
    .eq('id', user.id)

  // Build a minimal user object — full profile is fetched after role selection
  const payload = { sub: user.id, email: user.email, role: user.role }
  const access_token = fastifyInstance.jwt.sign(payload)
  const refresh_token = fastifyInstance.jwt.sign({ ...payload, type: 'refresh' })

  // Return enough for the frontend to store tokens and navigate to role select
  return {
    verified: true,
    access_token,
    refresh_token,
    user: { id: user.id, email: user.email, role: user.role },
  }
}

export async function loginUser(input: LoginInput, fastifyInstance: FastifyInstance) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error || !authData.user) throw unauthorized('Invalid email or password')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, phone, role, verified_phone, suspended, banned')
    .eq('id', authData.user.id)
    .single()

  if (!user) throw unauthorized('User not found')
  if (user.banned) throw unauthorized('Account has been banned')
  if (user.suspended) throw unauthorized('Account is suspended. Please contact support.')

  // ── Build the rich user object the frontend expects ──────────────────────
  type UserPayload = {
    id: string
    email: string
    phone: string
    role: string
    verified_phone: boolean
    name: string
    plan: string
    tenant_profile?: {
      free_credits: number
      is_subscribed: boolean
    }
    lister_profile?: {
      plan: string
      plan_expires_at: string | null
      verified_tier: string
      agency_id: string | null
    }
  }

  const userPayload: UserPayload = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    verified_phone: user.verified_phone,
    name: '',   // populated below
    plan: 'free',
  }

  if (user.role === 'tenant') {
    const { data: tp } = await supabaseAdmin
      .from('tenant_profiles')
      .select('full_name, free_credits, is_subscribed, subscription_expires_at')
      .eq('user_id', user.id)
      .single()

    userPayload.name = tp?.full_name ?? ''
    userPayload.tenant_profile = {
      free_credits: tp?.free_credits ?? 0,
      is_subscribed: tp?.is_subscribed ?? false,
    }
  } else if (['landlord', 'caretaker', 'agency'].includes(user.role)) {
    const { data: lp } = await supabaseAdmin
      .from('lister_profiles')
      .select('full_name, plan, plan_expires_at, id_verified')
      .eq('user_id', user.id)
      .single()

    const plan = lp?.plan ?? 'free'
    userPayload.name = lp?.full_name ?? ''
    userPayload.plan = plan

    // For agency owners, resolve their agency_id so the agency pages
    // (team members, CSV import) can target the right agency.
    let agencyId: string | null = null
    if (user.role === 'agency') {
      const { data: agency } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle()
      agencyId = agency?.id ?? null
    }

    // Derive verified_tier from the boolean id_verified column.
    // 'none' = not verified, 'id' = document verified.
    // Extend this when phone/visited tiers are implemented.
    userPayload.lister_profile = {
      plan,
      plan_expires_at: lp?.plan_expires_at ?? null,
      verified_tier: lp?.id_verified ? 'id' : 'none',
      agency_id: agencyId,
    }
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    plan: userPayload.plan,
  }
  const access_token = fastifyInstance.jwt.sign(payload)
  const refresh_token = fastifyInstance.jwt.sign({ ...payload, type: 'refresh' })

  return { access_token, refresh_token, user: userPayload }
}

export async function refreshAccessToken(
  refreshToken: string,
  fastifyInstance: FastifyInstance
) {
  let decoded: { sub: string; email: string; role: string; plan?: string; type?: string }
  try {
    decoded = fastifyInstance.jwt.verify(refreshToken)
  } catch {
    throw unauthorized('Invalid or expired refresh token')
  }

  if (decoded.type !== 'refresh') throw unauthorized('Not a refresh token')

  const payload = { sub: decoded.sub, email: decoded.email, role: decoded.role, plan: decoded.plan }
  const access_token = fastifyInstance.jwt.sign(payload)

  return { access_token }
}

export async function forgotPassword(email: string) {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
  })
  return { message: 'If that email is registered, you will receive a reset link shortly.' }
}
