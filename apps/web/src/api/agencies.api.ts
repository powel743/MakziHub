import client from './client'

export const createAgency = async (data: { name: string; description: string; logo_url?: string }) => {
  const res = await client.post('/agencies', data)
  return res.data
}

export const getAgency = async (id: string) => {
  const res = await client.get(`/agencies/${id}`)
  return res.data.data || res.data
}

export const inviteMember = async (agencyId: string, email: string, role: 'admin' | 'agent' = 'agent') => {
  const res = await client.post(`/agencies/${agencyId}/members`, { email, role })
  return res.data
}

export const previewImport = async (agencyId: string, file: File) => {
  const formData = new FormData()
  formData.append('csv', file)
  const res = await client.post(`/agencies/${agencyId}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const confirmImport = async (agencyId: string, validRows: unknown[]) => {
  // Backend creates the import session from the validated rows returned by preview.
  const res = await client.post(`/agencies/${agencyId}/import/confirm`, {
    valid_rows: validRows,
  })
  return res.data
}
