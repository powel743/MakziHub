import client from './client'
import type { SearchAlert } from '../utils/constants'

export const createAlert = async (data: Partial<SearchAlert>) => {
  const res = await client.post('/alerts', data)
  return res.data
}

export const getAlerts = async (): Promise<SearchAlert[]> => {
  const res = await client.get('/alerts')
  return res.data.alerts || res.data.data || []
}

export const deleteAlert = async (id: string) => {
  await client.delete(`/alerts/${id}`)
}
