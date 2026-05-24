import { z } from 'zod'

export const unlockSchema = z.object({
  listing_id: z.string().uuid(),
})

export type UnlockInput = z.infer<typeof unlockSchema>
