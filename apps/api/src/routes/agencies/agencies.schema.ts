import { z } from 'zod'
import { APPROVED_ESTATES, HOUSE_TYPES } from '../../db/client'

export const createAgencySchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  logo_url: z.string().url().optional(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'agent']).default('agent'),
})

export const csvRowSchema = z.object({
  title: z.string().min(5).max(200),
  estate: z.enum(APPROVED_ESTATES as [string, ...string[]]),
  address: z.string().min(5).max(300),
  rent_ksh: z.coerce.number().int().positive(),
  deposit_ksh: z.coerce.number().int().nonnegative().optional(),
  house_type: z.enum(HOUSE_TYPES as [string, ...string[]]),
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().nonnegative(),
  available_from: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  amenities: z.string().optional(),
  photo_urls: z.string().optional(),
})

export type CreateAgencyInput = z.infer<typeof createAgencySchema>
export type CsvRow = z.infer<typeof csvRowSchema>
