import { supabaseAdmin } from '../../config/supabase'
import { mpesaService, extractCallbackMeta, DarajaCallbackBody } from '../../services/mpesa.service'
import { sendNotificationEmail } from '../../services/africasTalking.service'
// import { sendSms } from '../../services/africasTalking.service' // Re-enable with AT
// import { smsTemplates } from '../../services/sms-templates' // Re-enable with AT
import { paymentQueue } from '../../jobs/queue'
import { notFound, unprocessable } from '../../utils/errors'
import { CREDIT_BUNDLES, SUBSCRIPTION_PLANS, BOOST_PRICES } from './payments.schema'
import logger from '../../utils/logger'

export async function handleMpesaCallback(body: DarajaCallbackBody) {
  const callback = body.Body.stkCallback
  const { CheckoutRequestID, ResultCode, ResultDesc } = callback

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, user_id, type, amount_ksh, metadata, status')
    .eq('mpesa_checkout_id', CheckoutRequestID)
    .single()

  if (!payment) {
    logger.warn({ CheckoutRequestID }, 'Payment not found for M-Pesa callback')
    return
  }

  if (payment.status !== 'pending') {
    logger.info({ paymentId: payment.id, status: payment.status }, 'Payment already processed')
    return
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('phone, email')
    .eq('id', payment.user_id)
    .single()

  if (ResultCode !== 0) {
    await supabaseAdmin
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', payment.id)

    // SMS disabled — notify via email instead
    if (user?.email) {
      await sendNotificationEmail({
        to: user.email,
        subject: 'MakaziHub Payment Failed',
        html: `<p>Your M-Pesa payment of KES ${payment.amount_ksh} did not go through. Please try again.</p>`,
      })
    }
    logger.info({ paymentId: payment.id, ResultDesc }, 'M-Pesa payment failed')
    return
  }

  const meta = extractCallbackMeta(callback)
  await supabaseAdmin
    .from('payments')
    .update({ status: 'complete', mpesa_receipt: meta.mpesaReceiptNumber })
    .eq('id', payment.id)

  switch (payment.type) {
    case 'unlock': {
      const listingId = (payment.metadata as { listing_id?: string })?.listing_id
      if (!listingId) break

      await supabaseAdmin
        .from('inquiries')
        .update({ unlocked_at: new Date().toISOString() })
        .eq('payment_id', payment.id)

      const { data: listing } = await supabaseAdmin
        .from('listings')
        .select('estate, lister_user_id')
        .eq('id', listingId)
        .single()

      if (listing) {
        const { data: listerUser } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', listing.lister_user_id)
          .single()
        if (listerUser?.email) {
          await sendNotificationEmail({
            to: listerUser.email,
            subject: 'Someone unlocked your listing',
            html: `<p>A tenant just unlocked your <strong>${listing.estate}</strong> listing. Check your <a href="https://makazihub.co.ke/lister/inbox">MakaziHub inbox</a>.</p>`,
          })
        }
      }
      break
    }

    case 'subscription': {
      const planKey = (payment.metadata as { plan?: string })?.plan
      if (!planKey) break

      const planConfig = SUBSCRIPTION_PLANS[planKey]
      if (!planConfig) break

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      if (planKey === 'tenant_unlimited') {
        await supabaseAdmin
          .from('tenant_profiles')
          .update({ is_subscribed: true, subscription_expires_at: expiresAt.toISOString() })
          .eq('user_id', payment.user_id)
      } else {
        await supabaseAdmin
          .from('lister_profiles')
          .update({ plan: planConfig.plan, plan_expires_at: expiresAt.toISOString() })
          .eq('user_id', payment.user_id)
      }
      break
    }

    case 'boost': {
      const boostMeta = payment.metadata as { listing_id?: string; days?: number }
      if (!boostMeta.listing_id || !boostMeta.days) break

      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + boostMeta.days)

      await supabaseAdmin.from('boosts').insert({
        listing_id: boostMeta.listing_id,
        lister_user_id: payment.user_id,
        amount_ksh: payment.amount_ksh,
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        payment_id: payment.id,
      })

      await supabaseAdmin
        .from('listings')
        .update({ featured_until: endsAt.toISOString() })
        .eq('id', boostMeta.listing_id)
      break
    }

    case 'badge': {
      await supabaseAdmin
        .from('lister_profiles')
        .update({ id_verified_paid: true })
        .eq('user_id', payment.user_id)
      break
    }

    case 'credits': {
      const bundle = (payment.metadata as { bundle?: string })?.bundle
      if (!bundle) break

      const bundleConfig = CREDIT_BUNDLES[bundle]
      if (!bundleConfig) break

      const { data: tp } = await supabaseAdmin
        .from('tenant_profiles')
        .select('free_credits')
        .eq('user_id', payment.user_id)
        .single()

      await supabaseAdmin
        .from('tenant_profiles')
        .update({ free_credits: (tp?.free_credits ?? 0) + bundleConfig.credits })
        .eq('user_id', payment.user_id)
      break
    }
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: payment.user_id,
    type: 'payment_complete',
    title: 'Payment Successful',
    body: `Your payment of KES ${payment.amount_ksh} was received.`,
    metadata: { payment_id: payment.id },
  })
}

export async function buyCredits(bundle: string, userId: string) {
  const bundleConfig = CREDIT_BUNDLES[bundle]
  if (!bundleConfig) throw unprocessable('Invalid bundle')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('id', userId)
    .single()
  if (!user?.phone) throw notFound('User phone not found')

  const stkResult = await mpesaService.initiateStkPush({
    phone: user.phone,
    amount: bundleConfig.price,
    accountRef: 'MHCredits',
    description: `${bundleConfig.credits} credits`,
  })

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
      type: 'credits',
      amount_ksh: bundleConfig.price,
      mpesa_checkout_id: stkResult.checkoutRequestId,
      status: 'pending',
      metadata: { bundle },
    })
    .select('id')
    .single()

  await paymentQueue.add(
    'payment-timeout',
    { paymentId: payment!.id, userId },
    { delay: 2 * 60 * 1000 }
  )

  return {
    status: 'pending',
    checkout_request_id: stkResult.checkoutRequestId,
    message: 'Enter your M-Pesa PIN to purchase credits.',
  }
}

export async function buySubscription(plan: string, userId: string) {
  const planConfig = SUBSCRIPTION_PLANS[plan]
  if (!planConfig) throw unprocessable('Invalid subscription plan')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('phone, role')
    .eq('id', userId)
    .single()
  if (!user?.phone) throw notFound('User phone not found')

  const stkResult = await mpesaService.initiateStkPush({
    phone: user.phone,
    amount: planConfig.price,
    accountRef: 'MHSubscription',
    description: `${plan} plan`,
  })

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
      type: 'subscription',
      amount_ksh: planConfig.price,
      mpesa_checkout_id: stkResult.checkoutRequestId,
      status: 'pending',
      metadata: { plan },
    })
    .select('id')
    .single()

  await paymentQueue.add(
    'payment-timeout',
    { paymentId: payment!.id, userId },
    { delay: 2 * 60 * 1000 }
  )

  return {
    status: 'pending',
    checkout_request_id: stkResult.checkoutRequestId,
    message: 'Enter your M-Pesa PIN to activate your subscription.',
  }
}