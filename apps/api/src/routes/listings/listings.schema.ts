import { z } from 'zod'
import { APPROVED_ESTATES, HOUSE_TYPES, AMENITIES } from '../../db/client'

const kenyanPhone = z
  .string()
  .regex(/^(\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number')

export const createListingSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  estate: z.enum(APPROVED_ESTATES as [string, ...string[]]),
  area: z.string().max(100).optional(),
  address: z.string().min(5).max(300),
  lat: z.number().optional(),
  lng: z.number().optional(),
  rent_ksh: z.number().int().positive(),
  deposit_ksh: z.number().int().nonnegative().optional(),
  house_type: z.enum(HOUSE_TYPES as [string, ...string[]]),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  size_sqft: z.number().int().positive().optional(),
  available_from: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), 'Invalid date')
    .refine((d) => new Date(d) >= new Date(new Date().setHours(0, 0, 0, 0)), 'Date must be today or future'),
  amenities: z
    .array(z.enum(AMENITIES as [string, ...string[]]))
    .optional()
    .default([]),
})

export const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(['available', 'taken', 'suspended', 'expired']).optional(),
})

export const listingsQuerySchema = z.object({
  estate: z.string().optional(),
  min_rent: z.coerce.number().int().positive().optional(),
  max_rent: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  house_type: z.string().optional(),
  verified_only: z.coerce.boolean().optional(),
  available_now: z.coerce.boolean().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'most_saved']).optional().default('newest'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
export type ListingsQuery = z.infer<typeof listingsQuerySchema>
