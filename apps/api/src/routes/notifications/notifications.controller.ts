import { FastifyRequest, FastifyReply } from 'fastify'
import { getNotifications, markRead, markAllRead } from './notifications.service'

export async function getNotificationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page, limit } = request.query as { page?: number; limit?: number }
  const result = await getNotifications(request.user.sub, page ?? 1, limit ?? 20)
  reply.send(result)
}

export async function markReadHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await markRead(id, request.user.sub)
  reply.status(204).send()
}

export async function markAllReadHandler(request: FastifyRequest, reply: FastifyReply) {
  await markAllRead(request.user.sub)
  reply.send({ message: 'All notifications marked as read' })
}
