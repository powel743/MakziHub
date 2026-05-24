import { FastifyRequest, FastifyReply } from 'fastify'

const ESCROW_NOT_IMPLEMENTED = {
  error: 'Not yet implemented — Phase 2',
  code: 'ESCROW_NOT_IMPLEMENTED',
}

export async function depositHandler(_request: FastifyRequest, reply: FastifyReply) {
  reply.status(503).send(ESCROW_NOT_IMPLEMENTED)
}

export async function confirmHandler(_request: FastifyRequest, reply: FastifyReply) {
  reply.status(503).send(ESCROW_NOT_IMPLEMENTED)
}

export async function refundHandler(_request: FastifyRequest, reply: FastifyReply) {
  reply.status(503).send(ESCROW_NOT_IMPLEMENTED)
}
