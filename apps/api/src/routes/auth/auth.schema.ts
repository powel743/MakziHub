import { z } from 'zod'

const kenyanPhone = z
  .string()
  .regex(/^(\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number (e.g. 0712345678 or +254712345678)')

export const registerSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: kenyanPhone,
  password: z.string().min(8).max(100),
  role: z.enum(['tenant', 'landlord', 'caretaker', 'agency']),
})

export const verifyOtpSchema = z.object({
  phone: kenyanPhone,
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
