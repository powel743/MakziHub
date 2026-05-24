import { z } from 'zod'

export const createReviewSchema = z.object({
  listing_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
