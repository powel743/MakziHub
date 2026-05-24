import { z } from 'zod'

export const moderateListingSchema = z.object({
  status: z.enum(['available', 'suspended']),
  reason: z.string().max(500).optional(),
})

export const moderateUserSchema = z.object({
  action: z.enum(['approve_id', 'suspend', 'unsuspend', 'ban', 'unban']),
  reason: z.string().max(500).optional(),
})

export const resolveFraudReportSchema = z.object({
  action: z.enum(['dismiss', 'suspend_listing', 'ban_lister', 'warn_lister']),
  note: z.string().max(500).optional(),
})
