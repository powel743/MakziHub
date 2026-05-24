import { Resend } from 'resend'
import { env } from '../config/env'
import { redis } from '../config/redis'
import logger from '../utils/logger'
// import axios from 'axios'  // Re-enable when SMS goes live

// const AT_BASE_URL = 'https://api.africastalking.com/version1'

const resend = new Resend(env.RESEND_API_KEY)

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ─── SMS (disabled — re-enable when Africa's Talking goes live) ───────────────
/*
interface SendSmsParams {
  to: string | string[]
  message: string
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
      logger.info({ recipients }, 'SMS delivered')
    }
  } catch (err) {
    logger.error({ err, to, message }, 'Failed to send SMS via Africa\'s Talking')
  }
}
*/
// ─────────────────────────────────────────────────────────────────────────────

export async function sendSms({ to, message }: { to: string | string[]; message: string }): Promise<void> {
  logger.info({ to, message }, "SMS sending mocked (Africa's Talking disabled)")
}

export async function sendOtp({ phone, email }: { phone: string; email: string }): Promise<string> {
  const otp = generateOtp()
  const key = `otp:${phone}`

  // Store OTP in Redis with 10-minute TTL
  await redis.setex(key, 600, otp)

  // Send via email (SMS re-enable later)
  await sendOtpEmail({ email, otp })

  // TODO: swap to SMS when AT goes live
  // const { smsTemplates } = await import('./sms-templates')
  // await sendSms({ to: phone, message: smsTemplates.signupOtp(otp) })

  logger.info({ phone, email }, 'OTP sent via email')
  return otp
}

export async function sendOtpEmail({ email, otp }: { email: string; otp: string }): Promise<void> {
  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Your MakaziHub verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Verify your MakaziHub account</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #666;">Valid for 10 minutes. Do not share this code.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">MakaziHub — Kenya's trusted rental marketplace</p>
        </div>
      `,
    })
    logger.info({ email }, 'OTP email sent via Resend')
  } catch (err) {
    logger.error({ err, email }, 'Failed to send OTP email via Resend')
    // Don't throw — email failure should not break main flow
  }
}

export async function sendNotificationEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  try {
    await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html })
    logger.info({ to, subject }, 'Notification email sent')
  } catch (err) {
    logger.error({ err, to }, 'Failed to send notification email')
  }
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const key = `otp:${phone}`
  const stored = await redis.get(key)

  if (!stored) return false
  if (stored !== otp) return false

  await redis.del(key)
  return true
}

export const africasTalkingService = {
  sendOtp,
  sendOtpEmail,
  sendNotificationEmail,
  verifyOtp,
}