import axios from 'axios'
import { env } from '../config/env'
import { redis } from '../config/redis'
import logger from '../utils/logger'

const AT_BASE_URL = 'https://api.africastalking.com/version1'

interface SendSmsParams {
  to: string | string[]
  message: string
}

interface SendOtpParams {
  phone: string
}

interface AtSmsResponse {
  SMSMessageData: {
    Message: string
    Recipients: Array<{
      statusCode: number
      number: string
      status: string
      cost: string
      messageId: string
    }>
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendSms({ to, message }: SendSmsParams): Promise<void> {
  const recipients = Array.isArray(to) ? to.join(',') : to

  try {
    const response = await axios.post<AtSmsResponse>(
      `${AT_BASE_URL}/messaging`,
      new URLSearchParams({
        username: env.AT_USERNAME,
        to: recipients,
        message,
        from: env.AT_SENDER_ID,
      }),
      {
        headers: {
          apiKey: env.AT_API_KEY,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const results = response.data.SMSMessageData.Recipients
    const failed = results.filter((r) => r.statusCode !== 101)

    if (failed.length > 0) {
      logger.warn({ failed }, 'Some SMS deliveries failed')
    } else {
      logger.info({ recipients, message: 'SMS sent successfully' }, 'SMS delivered')
    }
  } catch (err) {
    logger.error({ err, to, message }, 'Failed to send SMS via Africa\'s Talking')
    // Don't throw — SMS failure should not break main flow
  }
}

export async function sendOtp({ phone }: SendOtpParams): Promise<string> {
  const otp = generateOtp()
  const key = `otp:${phone}`

  // Store OTP in Redis with 10-minute TTL
  await redis.setex(key, 600, otp)

  const { smsTemplates } = await import('./sms-templates')
  await sendSms({ to: phone, message: smsTemplates.signupOtp(otp) })

  logger.info({ phone }, 'OTP sent')
  return otp
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const key = `otp:${phone}`
  const stored = await redis.get(key)

  if (!stored) return false
  if (stored !== otp) return false

  // Delete OTP after successful verification (one-time use)
  await redis.del(key)
  return true
}

export const africasTalkingService = {
  sendSms,
  sendOtp,
  verifyOtp,
}
