import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'
import logger from '../../utils/logger'

interface PaymentTimeoutData {
  paymentId: string
  userId: string
}

export async function paymentTimeoutProcessor(
  job: Job<PaymentTimeoutData>
): Promise<void> {
  const { paymentId, userId } = job.data

  logger.info({ paymentId }, 'Checking payment timeout')

  // Fetch payment status
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('id', paymentId)
    .single()

  if (error || !payment) {
    logger.warn({ paymentId, error }, 'Payment not found in timeout check')
    return
  }

  if (payment.status !== 'pending') {
    logger.info({ paymentId, status: payment.status }, 'Payment already resolved, no timeout action')
    return
  }

  // Mark as timed out
  await supabaseAdmin
    .from('payments')
    .update({ status: 'timed_out' })
    .eq('id', paymentId)

  // Fetch user phone
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('id', userId)
    .single()

  if (user?.phone) {
    await sendSms({
      to: user.phone,
      message: smsTemplates.paymentTimedOut(),
    })
  }

  // Create in-app notification
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'payment_timeout',
    title: 'Payment Prompt Expired',
    body: smsTemplates.paymentTimedOut(),
  })

  logger.info({ paymentId }, 'Payment marked as timed out')
}
