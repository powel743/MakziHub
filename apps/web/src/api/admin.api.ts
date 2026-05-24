import client from './client'

export const getListingsQueue = async (status?: string) => {
  const res = await client.get('/admin/listings', { params: { status } })
  return res.data
}

export const moderateListing = async (id: string, action: { status: string; note?: string }) => {
  const res = await client.patch(`/admin/listings/${id}`, action)
  return res.data
}

export const getUsers = async (search?: string) => {
  const res = await client.get('/admin/users', { params: { search } })
  return res.data
}

export const updateUser = async (id: string, data: { id_verified?: boolean; suspended?: boolean }) => {
  const res = await client.patch(`/admin/users/${id}`, data)
  return res.data
}

export const getFraudReports = async (resolved?: boolean) => {
  const res = await client.get('/admin/fraud-reports', { params: { resolved } })
  return res.data
}

export const resolveFraudReport = async (id: string, action: { action: 'keep' | 'suspend' }) => {
  const res = await client.patch(`/admin/fraud-reports/${id}`, { resolved: true, ...action })
  return res.data
}

export const getRevenue = async (month?: string) => {
  const res = await client.get('/admin/revenue', { params: { month } })
  return res.data
}

export const getAdminStats = async () => {
  const res = await client.get('/admin/dashboard')
  return res.data
}
