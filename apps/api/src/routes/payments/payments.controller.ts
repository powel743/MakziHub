import { FastifyRequest, FastifyReply } from 'fastify'
import { creditBundleSchema, subscriptionSchema } from './payments.schema'
import { handleMpesaCallback, buyCredits, buySubscription } from './payments.service'
import { unprocessable } from '../../utils/errors'
import { DarajaCallbackBody } from '../../services/mpesa.service'
import logger from '../../utils/logger'

export async function mpesaCallbackHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    await handleMpesaCallback(request.body as DarajaCallbackBody)
  } catch (err) {
    logger.error({ err }, 'Error processing M-Pesa callback')
  }
  // Always acknowledge Daraja with 200 + ResultCode 0
  reply.status(200).send({ ResultCode: 0, ResultDesc: 'Accepted' })
}

export async function buyCreditsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = creditBundleSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }
  const result = await buyCredits(parsed.data.bundle, request.user.sub)
  reply.status(202).send(result)
}

export async function buySubscriptionHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = subscriptionSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }
  const result = await buySubscription(parsed.data.plan, request.user.sub)
  reply.status(202).send(result)
}
