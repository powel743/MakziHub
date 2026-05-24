import axios from 'axios'
import { env } from '../config/env'
import { redis } from '../config/redis'
import logger from '../utils/logger'

const SANDBOX_BASE = 'https://sandbox.safaricom.co.ke'
const PRODUCTION_BASE = 'https://api.safaricom.co.ke'

function baseUrl(): string {
  return env.MPESA_ENV === 'production' ? PRODUCTION_BASE : SANDBOX_BASE
}

/** Convert Kenyan phone format 07XXXXXXXX → 2547XXXXXXXX */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '')
  if (cleaned.startsWith('+254')) return cleaned.replace('+', '')
  if (cleaned.startsWith('254')) return cleaned
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
    return `254${cleaned.slice(1)}`
  }
  return cleaned
}

async function getAccessToken(): Promise<string> {
  const cacheKey = 'mpesa:access_token'
  const cached = await redis.get(cacheKey)
  if (cached) return cached

  const credentials = Buffer.from(
    `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const response = await axios.get<{ access_token: string; expires_in: string }>(
    `${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  )

  const token = response.data.access_token
  // Cache for 55 minutes (token expires in 3600s)
  await redis.setex(cacheKey, 3300, token)

  return token
}

function generatePassword(timestamp: string): string {
  const raw = `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`
  return Buffer.from(raw).toString('base64')
}

function getTimestamp(): string {
  const now = new Date()
  return now
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14)
}

export interface StkPushParams {
  phone: string
  amount: number
  accountRef: string
  description: string
}

export interface StkPushResult {
  checkoutRequestId: string
  merchantRequestId: string
  responseCode: string
  responseDescription: string
  customerMessage: string
}

export async function initiateStkPush({
  phone,
  amount,
  accountRef,
  description,
}: StkPushParams): Promise<StkPushResult> {
  const token = await getAccessToken()
  const timestamp = getTimestamp()
  const password = generatePassword(timestamp)
  const formattedPhone = formatPhone(phone)

  const payload = {
    BusinessShortCode: env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: env.MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: env.MPESA_CALLBACK_URL,
    AccountReference: accountRef.slice(0, 12),
    TransactionDesc: description.slice(0, 13),
  }

  const response = await axios.post<{
    MerchantRequestID: string
    CheckoutRequestID: string
    ResponseCode: string
    ResponseDescription: string
    CustomerMessage: string
  }>(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  logger.info(
    { phone: formattedPhone, amount, checkoutRequestId: response.data.CheckoutRequestID },
    'STK Push initiated'
  )

  return {
    checkoutRequestId: response.data.CheckoutRequestID,
    merchantRequestId: response.data.MerchantRequestID,
    responseCode: response.data.ResponseCode,
    responseDescription: response.data.ResponseDescription,
    customerMessage: response.data.CustomerMessage,
  }
}

export interface DarajaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>
      }
    }
  }
}

export function verifyCallback(body: DarajaCallbackBody): boolean {
  return (
    body?.Body?.stkCallback?.CheckoutRequestID !== undefined &&
    body?.Body?.stkCallback?.ResultCode !== undefined
  )
}

export function extractCallbackMeta(callback: DarajaCallbackBody['Body']['stkCallback']): {
  amount?: number
  mpesaReceiptNumber?: string
  transactionDate?: string
  phoneNumber?: string
} {
  const items = callback.CallbackMetadata?.Item ?? []
  const get = (name: string) => items.find((i) => i.Name === name)?.Value

  return {
    amount: get('Amount') as number | undefined,
    mpesaReceiptNumber: get('MpesaReceiptNumber') as string | undefined,
    transactionDate: get('TransactionDate') as string | undefined,
    phoneNumber: get('PhoneNumber') as string | undefined,
  }
}

export const mpesaService = {
  initiateStkPush,
  verifyCallback,
  extractCallbackMeta,
  formatPhone,
}
