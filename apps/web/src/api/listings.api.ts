import client from './client'
import type { Listing, ListingFilters, PaginationMeta } from '../utils/constants'

export interface ListingsResponse {
  data: Listing[]
  meta: PaginationMeta
}

export interface CreateListingDto {
  title: string
  description: string
  estate: string
  address: string
  lat?: number
  lng?: number
  rent_ksh: number
  deposit_ksh?: number
  house_type: string
  bedrooms: number
  bathrooms: number
  size_sqft?: number
  available_from: string
  amenities: string[]
  furnished?: boolean
}

export const getListings = async (filters: ListingFilters): Promise<ListingsResponse> => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  )
  const res = await client.get('/listings', { params })
  // The API returns { listings, total, page, pages }. Normalise to { data, meta }.
  const body = res.data ?? {}
  return {
    data: body.data ?? body.listings ?? [],
    meta: {
      total: body.meta?.total ?? body.total ?? 0,
      page: body.meta?.page ?? body.page ?? 1,
      pages: body.meta?.pages ?? body.pages ?? 0,
      limit: body.meta?.limit ?? filters.limit ?? 20,
    },
  }
}

export const getListing = async (id: string): Promise<Listing> => {
  const res = await client.get(`/listings/${id}`)
  return res.data.data || res.data
}

export const createListing = async (data: CreateListingDto): Promise<Listing> => {
  const res = await client.post('/listings', data)
  return res.data
}

export const updateListing = async (id: string, data: Partial<CreateListingDto & { status: string }>) => {
  const res = await client.patch(`/listings/${id}`, data)
  return res.data
}

export const deleteListing = async (id: string) => {
  await client.delete(`/listings/${id}`)
}

export const uploadPhoto = async (id: string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post(`/listings/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const deletePhoto = async (listingId: string, photoId: string) => {
  await client.delete(`/listings/${listingId}/photos/${photoId}`)
}

export const saveListing = async (id: string): Promise<{ saved: boolean }> => {
  const res = await client.post(`/listings/${id}/save`)
  return res.data
}

export const reportListing = async (id: string, reason: string, note?: string) => {
  const res = await client.post(`/listings/${id}/report`, { reason, note })
  return res.data
}

export const getListingReviews = async (id: string) => {
  const res = await client.get(`/listings/${id}/reviews`)
  return res.data
}

export const submitReview = async (id: string, data: { rating: number; body: string }) => {
  const res = await client.post(`/listings/${id}/reviews`, data)
  return res.data
}
