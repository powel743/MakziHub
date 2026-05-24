import client from './client'
import type { User, UserRole } from '../utils/constants'

export interface RegisterDto {
  full_name: string
  email: string
  phone: string
  password: string
  role: UserRole
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export const register = async (data: RegisterDto) => {
  const res = await client.post('/auth/register', data)
  return res.data
}

export const verifyOtp = async (data: { phone: string; otp: string }): Promise<AuthResponse> => {
  const res = await client.post('/auth/verify-otp', data)
  return res.data
}

export const login = async (data: LoginDto): Promise<AuthResponse> => {
  const res = await client.post('/auth/login', data)
  return res.data
}

export const refreshToken = async (data: { refresh_token: string }) => {
  const res = await client.post('/auth/refresh', data)
  return res.data
}

export const forgotPassword = async (data: { email: string }) => {
  const res = await client.post('/auth/forgot-password', data)
  return res.data
}
