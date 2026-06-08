import client from './client'

export interface EstateContent {
  id: number
  name: string
  slug: string
  description: string | null
  transport_links: string[] | null
  nearby_schools: string[] | null
  seo_meta_description: string | null
}

export const getEstate = async (identifier: string): Promise<EstateContent> => {
  const res = await client.get(`/estates/${identifier}`)
  return res.data
}
