import { FastifyRequest, FastifyReply } from 'fastify'
import { createAlertSchema } from './alerts.schema'
import { createAlert, getUserAlerts, deleteAlert, toggleAlert } from './alerts.service'
import { unprocessable } from '../../utils/errors'

export async function createAlertHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createAlertSchema.safeParse(request.body)
  if (!parsed.success) throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  const result = await createAlert(parsed.data, request.user.sub)
  reply.status(201).send(result)
}

export async function getUserAlertsHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await getUserAlerts(request.user.sub)
  reply.send({ alerts: result })
}

export async function deleteAlertHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteAlert(id, request.user.sub)
  reply.status(204).send()
}

export async function toggleAlertHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const result = await toggleAlert(id, request.user.sub)
  reply.send(result)
}
