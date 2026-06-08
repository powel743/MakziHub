// These three lists MUST match the DB enums / CHECK constraints exactly
// (migrations 005 & 006, mirrored in apps/api/src/db/client.ts). The API
// validates create/update payloads against these values, so any drift here
// silently breaks listing creation and filtering.
export const APPROVED_ESTATES = [
  'Kasarani', 'Ruaka', 'Westlands', 'Kilimani', 'Embakasi',
  'Donholm', 'Umoja', 'Githurai', 'Roysambu', 'South B',
  'South C', 'Ngong Road', 'Rongai', 'Thika Road', 'Kiambu Road',
  'Kikuyu', 'Kahawa', 'Zimmerman', 'Pipeline', 'Mathare',
  'Pangani', 'Parklands', 'Lavington', 'Karen', 'Langata',
  'Industrial Area', 'Eastleigh', 'Buruburu', 'Kayole', 'Komarock',
]

// value = exact DB house_type enum string (migration 005)
export const HOUSE_TYPES = [
  { value: 'Bedsitter', label: 'Bedsitter' },
  { value: 'Studio', label: 'Studio' },
  { value: '1 Bedroom', label: '1 Bedroom' },
  { value: '2 Bedroom', label: '2 Bedroom' },
  { value: '3 Bedroom', label: '3 Bedroom' },
  { value: '4+ Bedroom', label: '4+ Bedroom' },
  { value: 'Maisonette', label: 'Maisonette' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Bungalow', label: 'Bungalow' },
  { value: 'Servant Quarter (SQ)', label: 'Servant Quarter (SQ)' },
]

// value = exact DB amenity CHECK value (migration 006)
export const AMENITIES = [
  { value: 'water_council', label: 'Council Water' },
  { value: 'water_borehole', label: 'Borehole Water' },
  { value: 'water_both', label: 'Council & Borehole Water' },
  { value: 'water_24hr', label: '24-Hour Water' },
  { value: 'parking_open', label: 'Open Parking' },
  { value: 'parking_covered', label: 'Covered Parking' },
  { value: 'parking_none', label: 'No Parking' },
  { value: 'security_guard', label: 'Security Guard' },
  { value: 'electric_fence', label: 'Electric Fence' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'fibre_wifi', label: 'Fibre / WiFi Ready' },
  { value: 'generator', label: 'Generator Backup' },
  { value: 'solar_water_heater', label: 'Solar Water Heater' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'tiled_floors', label: 'Tiled Floors' },
  { value: 'fitted_kitchen', label: 'Fitted Kitchen' },
  { value: 'ensuite_master', label: 'Ensuite Master' },
  { value: 'dstv_dish', label: 'DSTV Dish' },
  { value: 'lift_elevator', label: 'Lift / Elevator' },
  { value: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
  { value: 'pet_friendly', label: 'Pet Friendly' },
  { value: 'children_play_area', label: "Children's Play Area" },
]

export const PLANS = {
  tenant_unlimited: { price: 300, label: 'Unlimited Access', period: 'month' },
  caretaker_pro: { price: 1000, label: 'Pro Lister', period: 'month' },
  business: { price: 8000, label: 'Business / Agency', period: 'month' },
}

export const CREDIT_BUNDLES = {
  '3credits': { price: 250, credits: 3 },
  '10credits': { price: 750, credits: 10 },
}

export const NAIROBI_CENTER: [number, number] = [-1.2921, 36.8219]

// Canonical public site origin (used for SEO canonical/OG/sitemap/JSON-LD).
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) || 'https://www.makazihub.co.ke'

// FIX: Removed 'lister' — it was never a valid DB enum value.
// Valid DB roles: tenant | landlord | caretaker | agency | admin
export type UserRole = 'tenant' | 'landlord' | 'caretaker' | 'agency' | 'admin'

// Lister roles (landlord | caretaker | agency) share the lister dashboard
export const LISTER_ROLES: UserRole[] = ['landlord', 'caretaker', 'agency']

export function isListerRole(role: UserRole): boolean {
  return LISTER_ROLES.includes(role)
}

export type VerifiedTier = 'none' | 'phone' | 'id' | 'visited'
export type ListingStatus = 'available' | 'taken' | 'suspended' | 'expired'
export type PlanType = 'free' | 'pro' | 'business'
export type PaymentStatus = 'idle' | 'pending' | 'complete' | 'failed' | 'timeout'

/**
 * User shape returned by POST /auth/login and PATCH /auth/me.
 * Matches the `userPayload` built in auth.service.ts loginUser().
 */
export interface User {
  id: string
  email: string
  phone: string
  /** full_name from the relevant profile row */
  name: string
  role: UserRole
  verified_phone: boolean
  tenant_profile?: {
    free_credits: number
    is_subscribed: boolean
  }
  lister_profile?: {
    plan: PlanType
    plan_expires_at: string | null
    /** Derived from lister_profiles.id_verified: false → 'none', true → 'id' */
    verified_tier: VerifiedTier
    /** Set for agency owners; used by the team & CSV-import pages */
    agency_id: string | null
  }
}

// ── Listing / Inquiry / etc. types (unchanged) ──────────────────────────────

export interface ContactDetails {
  address: string
  phone: string
  whatsapp_url: string
}

export interface ListingPhoto {
  id: string
  url: string
  order: number
}

export interface Notification {
  id: string
  type?: string
  title: string
  body: string
  read: boolean
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface SearchAlert {
  id: string
  estate?: string | null
  max_rent?: number | null
  bedrooms?: number | null
  house_type?: string | null
  active?: boolean
  created_at?: string
}

export interface Inquiry {
  inquiry_id: string
  unlocked_at: string | null
  listing: {
    id: string
    title: string
    estate: string
    rent_ksh: number
    house_type: string
    cover_photo: string | null
  } | null
  contact_details?: ContactDetails | null
}

export interface PaginationMeta {
  total: number
  page: number
  pages: number
  limit: number
}

export interface Listing {
  id: string
  title: string
  description?: string
  estate: string
  area?: string
  address?: string
  lat?: number
  lng?: number
  rent_ksh: number
  deposit_ksh?: number
  house_type: string
  bedrooms: number
  bathrooms: number
  size_sqft?: number
  available_from: string
  status: ListingStatus
  verified_tier: VerifiedTier
  featured_until?: string
  saved_count: number
  view_count: number
  cover_photo_url?: string | null
  is_featured?: boolean
  lister_user_id?: string
  /** True if the listing's lister has an approved ID verification */
  lister_id_verified?: boolean
  /** Present on the listing-detail response */
  lister?: {
    name: string
    id_verified?: boolean
    verified_tier?: VerifiedTier
    member_since?: string
    agency?: { id: string; name: string; logo_url?: string | null } | null
  } | null
  created_at: string
  updated_at?: string
  /** Detail endpoint returns photos[] + amenities[] + contact_details; list
   *  endpoints return cover_photo_url / listing_photos. All optional so one
   *  Listing type covers every endpoint's shape. */
  photos?: ListingPhoto[]
  amenities?: string[]
  contact_details?: ContactDetails | null
  furnished?: boolean
  listing_photos?: ListingPhoto[]
  listing_amenities?: Array<{ amenity: string }>
}

export interface ListingFilters {
  estate?: string
  min_rent?: number
  max_rent?: number
  bedrooms?: number
  house_type?: string
  verified_only?: boolean
  available_now?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'most_saved'
  page?: number
  limit?: number
}
