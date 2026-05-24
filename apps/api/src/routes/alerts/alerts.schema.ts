import { z } from 'zod'
import { APPROVED_ESTATES, HOUSE_TYPES } from '../../db/client'

export const createAlertSchema = z.object({
  estate: z.enum(APPROVED_ESTATES as unknown as [string, ...string[]]).optional(),
  max_rent: z.number().int().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  house_type: z.enum(HOUSE_TYPES as unknown as [string, ...string[]]).optional(),
})

export type CreateAlertInput = z.infer<typeof createAlertSchema>
