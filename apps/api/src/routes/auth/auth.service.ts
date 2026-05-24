import { supabase, supabaseAdmin } from '../../config/supabase'
import { sendOtp, verifyOtp as checkOtp } from '../../services/africasTalking.service'
import { conflict, unauthorized, unprocessable } from '../../utils/errors'
import type { RegisterInput, LoginInput, VerifyOtpInput } from './auth.schema'

export async function registerUser(input: RegisterInput) {
  // Check if email or phone already exists
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .or(`email.eq.${input.email},phone.eq.${input.phone}`)
    .maybeSingle()

  if (existing) throw conflict('Email or phone already registered')

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
  })

  if (authError || !authData.user) {
    throw unprocessable(authError?.message ?? 'Failed to create auth user')
  }

  const userId = authData.user.id

  // Insert into users table
  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: userId,
    email: input.email,
    phone: input.phone,
    role: input.role,
    verified_phone: false,
  })

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw unprocessable(userError.message)
  }

  // Create profile based on role
  if (input.role === 'tenant') {
    await supabaseAdmin.from('tenant_profiles').insert({
      user_id: userId,
      full_name: input.full_name,
      free_credits: 3,
    })
  } else {
    await supabaseAdmin.from('lister_profiles').insert({
      user_id: userId,
      full_name: input.full_name,
      plan: 'free',
    })
  }

  // Send OTP
  await sendOtp({ phone: input.phone })

  return { user_id: userId, email: input.email, role: input.role }
}

export async function verifyOtpAndLogin(
  input: VerifyOtpInput,
  fastifyInstance: { jwt: { sign: (payload: object) => string } }
) {
  // Find user by phone
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('phone', input.phone)
    .single()

  if (!user) throw unauthorized('Phone number not found')

  const valid = await checkOtp(input.phone, input.otp)
  if (!valid) throw unauthorized('Invalid or expired OTP')

  // Mark phone as verified
  await supabaseAdmin
    .from('users')
    .update({ verified_phone: true })
    .eq('id', user.id)

  const payload = { sub: user.id, email: user.email, role: user.role }
  const access_token = fastifyInstance.jwt.sign(payload)
  const refresh_token = fastifyInstance.jwt.sign({ ...payload, type: 'refresh' })

  return { verified: true, access_token, refresh_token }
}

export async function loginUser(
  input: LoginInput,
  fastifyInstance: { jwt: { sign: (payload: object) => string } }
) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error || !authData.user) throw unauthorized('Invalid email or password')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, role, suspended, banned')
    .eq('id', authData.user.id)
    .single()

  if (!user) throw unauthorized('User not found')
  if (user.banned) throw unauthorized('Account has been banned')
  if (user.suspended) throw unauthorized('Account is suspended. Please contact support.')

  // Get plan if lister
  let plan = 'free'
  if (['landlord', 'caretaker', 'agency'].includes(user.role)) {
    const { data: lp } = await supabaseAdmin
      .from('lister_profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single()
    plan = lp?.plan ?? 'free'
  }

  const payload = { sub: user.id, email: user.email, role: user.role, plan }
  const access_token = fastifyInstance.jwt.sign(payload)
  const refresh_token = fastifyInstance.jwt.sign({ ...payload, type: 'refresh' })

  return {
    access_token,
    refresh_token,
    user: { id: user.id, email: user.email, role: user.role, plan },
  }
}

export async function refreshAccessToken(
  refreshToken: string,
  fastifyInstance: {
    jwt: {
      verify: (token: string) => { sub: string; email: string; role: string; plan?: string; type?: string }
      sign: (payload: object) => string
    }
  }
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
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
  })
  // Don't reveal if email exists or not
  return { message: 'If that email is registered, you will receive a reset link shortly.' }
}
