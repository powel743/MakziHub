import { FastifyRequest, FastifyReply } from 'fastify'
import { getSavedListings } from './saves.service'

export async function getSavedListingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await getSavedListings(request.user.sub)
  reply.send({ saved: result })
}
