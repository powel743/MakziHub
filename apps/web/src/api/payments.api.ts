import client from './client'

export const buyCredits = async (bundle: '3credits' | '10credits', phone: string) => {
  const res = await client.post('/payments/credits/buy', { bundle, phone })
  return res.data
}

export const subscribe = async (plan: string, phone: string) => {
  const res = await client.post('/payments/subscription', { plan, phone })
  return res.data
}

export const getPaymentStatus = async (checkoutRequestId: string) => {
  const res = await client.get(`/payments/status/${checkoutRequestId}`)
  return res.data
}

export const boostListing = async (listingId: string, plan: '7day' | '14day' | '30day') => {
  const res = await client.post(`/listings/${listingId}/boost`, { plan })
  return res.data
}
