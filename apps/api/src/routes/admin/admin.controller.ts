import { FastifyRequest, FastifyReply } from 'fastify'
import { moderateListingSchema, moderateUserSchema, resolveFraudReportSchema } from './admin.schema'
import {
  getAdminStats,
  getModerationQueue,
  adminUpdateListing,
  searchUsers,
  adminUpdateUser,
  getFraudReports,
  resolveFraudReport,
  getRevenueReport,
  getVerifications,
  approveVerification,
  rejectVerification,
  getEstate,
  updateEstate,
} from './admin.service'
import { unprocessable } from '../../utils/errors'

export async function getAdminStatsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const result = await getAdminStats()
  reply.send(result)
}

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

export async function getVerificationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { status, page, limit } = request.query as { status?: string; page?: number; limit?: number }
  const result = await getVerifications(status ?? 'pending', page ?? 1, limit ?? 20)
  reply.send(result)
}

export async function approveVerificationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const result = await approveVerification(id, request.user.sub)
  reply.send(result)
}

export async function rejectVerificationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { reason } = request.body as { reason?: string }
  if (!reason || !reason.trim()) throw unprocessable('reason is required')
  const result = await rejectVerification(id, reason, request.user.sub)
  reply.send(result)
}

export async function getEstateHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const result = await getEstate(id)
  reply.send(result)
}

export async function updateEstateHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const result = await updateEstate(id, request.body as Record<string, never>)
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
