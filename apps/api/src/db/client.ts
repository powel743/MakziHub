import { supabase, supabaseAdmin } from '../config/supabase'

export { supabase, supabaseAdmin }

// Convenience type for Supabase query results
export type QueryResult<T> = {
  data: T | null
  error: Error | null
}

// Approved estates list for validation
export const APPROVED_ESTATES = [
  'Kasarani', 'Ruaka', 'Westlands', 'Kilimani', 'Embakasi',
  'Donholm', 'Umoja', 'Githurai', 'Roysambu', 'South B',
  'South C', 'Ngong Road', 'Rongai', 'Thika Road', 'Kiambu Road',
  'Kikuyu', 'Kahawa', 'Zimmerman', 'Pipeline', 'Mathare',
  'Pangani', 'Parklands', 'Lavington', 'Karen', 'Langata',
  'Industrial Area', 'Eastleigh', 'Buruburu', 'Kayole', 'Komarock',
] as const

export type ApprovedEstate = typeof APPROVED_ESTATES[number]

// Supported house types
export const HOUSE_TYPES = [
  'Bedsitter', 'Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom',
  '4+ Bedroom', 'Maisonette', 'Townhouse', 'Bungalow', 'Servant Quarter (SQ)',
] as const

export type HouseType = typeof HOUSE_TYPES[number]

// Supported amenities
export const AMENITIES = [
  'water_council', 'water_borehole', 'water_both', 'water_24hr',
  'parking_open', 'parking_covered', 'parking_none',
  'security_guard', 'electric_fence', 'cctv',
  'fibre_wifi', 'generator', 'solar_water_heater',
  'balcony', 'tiled_floors', 'fitted_kitchen', 'ensuite_master',
  'dstv_dish', 'lift_elevator', 'wheelchair_accessible',
  'pet_friendly', 'children_play_area',
] as const

export type Amenity = typeof AMENITIES[number]
