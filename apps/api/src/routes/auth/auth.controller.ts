import { FastifyRequest, FastifyReply } from 'fastify'
import {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
} from './auth.schema'
import {
  registerUser,
  verifyOtpAndLogin,
  loginUser,
  refreshAccessToken,
  forgotPassword,
} from './auth.service'
import { unprocessable } from '../../utils/errors'

export async function registerHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = registerSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }

  const result = await registerUser(parsed.data)
  reply.status(201).send({
    ...result,
    message: 'OTP sent to phone. Please verify to complete registration.',
  })
}

export async function verifyOtpHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = verifyOtpSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }

  const result = await verifyOtpAndLogin(parsed.data, request.server)
  reply.status(200).send(result)
}

export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }

  const result = await loginUser(parsed.data, request.server)
  reply.status(200).send(result)
}

export async function refreshHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = refreshSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }

  const result = await refreshAccessToken(parsed.data.refresh_token, request.server)
  reply.status(200).send(result)
}

export async function forgotPasswordHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }

  const result = await forgotPassword(parsed.data.email)
  reply.status(200).send(result)
}
