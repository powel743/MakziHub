import { FastifyRequest, FastifyReply } from 'fastify'
import { moderateListingSchema, moderateUserSchema, resolveFraudReportSchema } from './admin.schema'
import {
  getModerationQueue,
  adminUpdateListing,
  searchUsers,
  adminUpdateUser,
  getFraudReports,
  resolveFraudReport,
  getRevenueReport,
} from './admin.service'
import { unprocessable } from '../../utils/errors'

export async function getModerationQueueHandler(request: FastifyRequest, reply: FastifyReply) {
  const { status, page, limit } = request.query as {
    status?: string; page?: number; limit?: number
  }
  const result = await getModerationQueue(status, page ?? 1, limit ?? 20)
  reply.send(result)
}

export async function adminUpdateListingHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const parsed = moderateListingSchema.safeParse(request.body)
  if (!parsed.success) throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  const result = await adminUpdateListing(id, parsed.data.status, parsed.data.reason)
  reply.send(result)
}

export async function searchUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const { search, page, limit } = request.query as {
    search?: string; page?: number; limit?: number
  }
  const result = await searchUsers(search ?? '', page ?? 1, limit ?? 20)
  reply.send(result)
}

export async function adminUpdateUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const parsed = moderateUserSchema.safeParse(request.body)
  if (!parsed.success) throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  const result = await adminUpdateUser(id, parsed.data.action, parsed.data.reason, request.user.sub)
  reply.send(result)
}

export async function getFraudReportsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { resolved, page, limit } = request.query as {
    resolved?: string; page?: number; limit?: number
  }
  const result = await getFraudReports(resolved !== 'false', page ?? 1, limit ?? 20)
  reply.send(result)
}

export async function resolveFraudReportHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const parsed = resolveFraudReportSchema.safeParse(request.body)
  if (!parsed.success) throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  const result = await resolveFraudReport(id, parsed.data.action, parsed.data.note, request.user.sub)
  reply.send(result)
}

export async function getRevenueReportHandler(request: FastifyRequest, reply: FastifyReply) {
  const { month } = request.query as { month?: string }
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw unprocessable('month parameter required in YYYY-MM format')
  }
  const result = await getRevenueReport(month)
  reply.send(result)
}
