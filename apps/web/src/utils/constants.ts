export const APPROVED_ESTATES = [
  'Westlands', 'Kilimani', 'Lavington', 'Karen', 'Langata',
  'South B', 'South C', 'Eastleigh', 'Umoja', 'Buruburu',
  'Donholm', 'Komarock', 'Rongai', 'Ngong', 'Kikuyu',
  'Ruiru', 'Juja', 'Thika', 'Kiambu', 'Githurai',
  'Kasarani', 'Roysambu', 'Zimmerman', 'Mirema', 'Ruaka',
  'Banana Hill', 'Kabete', 'Dagoretti', 'Runda', 'Pangani',
  'Parklands', 'Industrial Area', 'Pipeline', 'Mathare',
  'Embakasi', 'Kayole', 'Zimmerman', 'Thika Road', 'Ngong Road',
]

export const HOUSE_TYPES = [
  { value: 'bedsitter', label: 'Bedsitter' },
  { value: 'single_room', label: 'Single Room' },
  { value: '1_bedroom', label: '1 Bedroom' },
  { value: '2_bedroom', label: '2 Bedroom' },
  { value: '3_bedroom', label: '3 Bedroom' },
  { value: '4_bedroom_plus', label: '4+ Bedroom' },
  { value: 'studio', label: 'Studio' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'maisonette', label: 'Maisonette' },
  { value: 'bungalow', label: 'Bungalow' },
]

export const AMENITIES = [
  { value: 'parking', label: 'Parking' },
  { value: 'wifi', label: 'WiFi / Fibre Ready' },
  { value: 'water_24hrs', label: '24-Hr Water' },
  { value: 'backup_generator', label: 'Generator Backup' },
  { value: 'security_guard', label: 'Security Guard' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'gym', label: 'Gym' },
  { value: 'swimming_pool', label: 'Swimming Pool' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'dsq', label: "DSQ (Servant's Quarter)" },
  { value: 'borehole', label: 'Borehole Water' },
  { value: 'solar', label: 'Solar Water Heater' },
  { value: 'lift', label: 'Elevator / Lift' },
  { value: 'tiled_floors', label: 'Tiled Floors' },
  { value: 'ensuite', label: 'Ensuite Master' },
  { value: 'modern_kitchen', label: 'Modern Kitchen' },
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

export type UserRole = 'tenant' | 'lister' | 'agency' | 'admin'
export type VerifiedTier = 'none' | 'phone' | 'id' | 'visited'
export type ListingStatus = 'available' | 'taken' | 'suspended' | 'expired'
export type PlanType = 'free' | 'pro' | 'business'
export type PaymentStatus = 'idle' | 'pending' | 'complete' | 'failed' | 'timeout'

export interface User {
  id: string
  email: string
  phone: string
  name: string
  role: UserRole
  verified_phone: boolean
  tenant_profile?: {
    free_credits: number
    is_subscribed: boolean
  }
  lister_profile?: {
    plan: PlanType
    plan_expires_at: string
    verified_tier: VerifiedTier
  }
}

export interface ListingPhoto {
  id: string
  url: string
  order: number
}

export interface Listing {
  id: string
  title: string
  slug: string
  estate: string
  house_type: string
  rent: number
  deposit?: number
  bedrooms: number
  bathrooms: number
  description: string
  furnished: boolean
  available_from: string
  status: ListingStatus
  verified_tier: VerifiedTier
  amenities: string[]
  photos: ListingPhoto[]
  lister: {
    id: string
    name: string
    agency?: {
      id: string
      name: string
      logo_url: string
    }
  }
  lat?: number
  lng?: number
  saved_count: number
  view_count: number
  contact_details: ContactDetails | null
  size_sqft?: number
  address?: string
}

export interface ContactDetails {
  address: string
  phone: string
  whatsapp_url: string
}

export interface ListingFilters {
  estate?: string
  min_rent?: number
  max_rent?: number
  bedrooms?: number
  house_type?: string
  verified_only?: boolean
  available_now?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'featured'
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface Inquiry {
  listing_id: string
  listing_title: string
  estate: string
  unlocked_at: string
  contact_details: ContactDetails
  refunded: boolean
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
}

export interface Agency {
  id: string
  name: string
  logo_url?: string
  description: string
  verified: boolean
  member_since: string
  listing_count: number
  listings: Listing[]
}

export interface SearchAlert {
  id: string
  estate: string
  max_rent: number
  bedrooms?: number
  house_type?: string
  active: boolean
}

export interface Review {
  id: string
  rating: number
  body: string
  created_at: string
  tenant_name_masked: string
}

export interface FraudReport {
  id: string
  listing_id: string
  listing_title: string
  reporter_user_id: string
  reason: string
  created_at: string
  resolved: boolean
}
