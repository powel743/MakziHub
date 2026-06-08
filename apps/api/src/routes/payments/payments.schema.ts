import { z } from 'zod'

export const creditBundleSchema = z.object({
  bundle: z.enum(['3credits', '10credits']),
})

export const subscriptionSchema = z.object({
  plan: z.enum(['tenant_unlimited', 'caretaker_pro', 'business']),
})

export const boostSchema = z.object({
  listing_id: z.string().uuid(),
  days: z.number().int().min(1).max(30),
})

export const badgeSchema = z.object({
  id_doc_url: z.string().url(),
})

export const CREDIT_BUNDLES: Record<string, { credits: number; price: number }> = {
  '3credits': { credits: 3, price: 250 },
  '10credits': { credits: 10, price: 750 },
}

export const SUBSCRIPTION_PLANS: Record<string, { price: number; role: string; plan: string }> = {
  tenant_unlimited: { price: 300, role: 'tenant', plan: 'tenant_unlimited' },
  caretaker_pro: { price: 1000, role: 'caretaker', plan: 'pro' },
  business: { price: 8000, role: 'agency', plan: 'business' },
}

// Featured-boost plans (PRD §3.2 featured placement)
export const BOOST_PLANS: Record<string, { days: number; price: number }> = {
  '7day': { days: 7, price: 500 },
  '14day': { days: 14, price: 900 },
  '30day': { days: 30, price: 1500 },
}

export const BOOST_PRICES: Record<number, number> = {
  7: 500,
  14: 900,
  30: 1500,
}
