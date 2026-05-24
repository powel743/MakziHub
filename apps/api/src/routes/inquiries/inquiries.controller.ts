import { FastifyRequest, FastifyReply } from 'fastify'
import { unlockSchema } from './inquiries.schema'
import { unlockListing, getTenantInquiries } from './inquiries.service'
import { unprocessable } from '../../utils/errors'

export async function unlockHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = unlockSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }

  const result = await unlockListing(parsed.data.listing_id, request.user.sub)

  if (result.status === 'pending') {
    return reply.status(202).send(result)
  }
  reply.send(result)
}

export async function getInquiriesHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await getTenantInquiries(request.user.sub)
  reply.send({ inquiries: result })
}
