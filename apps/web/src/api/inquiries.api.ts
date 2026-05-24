import client from './client'
import type { Inquiry, ContactDetails } from '../utils/constants'

export type UnlockStatus = 'already_unlocked' | 'unlocked' | 'pending'

export interface UnlockResponse {
  status: UnlockStatus
  contact_details?: ContactDetails
  checkout_request_id?: string
}

export const unlockContact = async (listing_id: string, phone: string): Promise<UnlockResponse> => {
  const res = await client.post('/inquiries/unlock', { listing_id, phone })
  return res.data
}

export const getMyInquiries = async (): Promise<Inquiry[]> => {
  const res = await client.get('/inquiries')
  return res.data.inquiries || res.data.data || []
}
