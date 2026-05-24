import { FastifyRequest, FastifyReply } from 'fastify'
import { createReviewSchema } from './reviews.schema'
import { createReview, getListingReviews, deleteReview } from './reviews.service'
import { unprocessable } from '../../utils/errors'

export async function createReviewHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createReviewSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }
  const result = await createReview(parsed.data, request.user.sub)
  reply.status(201).send(result)
}

export async function getListingReviewsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { listing_id } = request.params as { listing_id: string }
  const result = await getListingReviews(listing_id)
  reply.send(result)
}

export async function deleteReviewHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteReview(id, request.user.sub, request.user.role)
  reply.status(204).send()
}
