import client from './client'

export interface VerificationStatus {
  status: 'unverified' | 'pending' | 'verified' | 'rejected'
  id_verified: boolean
  latest: {
    id: string
    id_type: string
    status: string
    rejection_reason: string | null
    submitted_at: string
    reviewed_at: string | null
  } | null
}

export const getVerificationStatus = async (): Promise<VerificationStatus> => {
  const res = await client.get('/lister/verification')
  return res.data
}

export const uploadVerification = async (
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<{ message: string; verification_id: string }> => {
  const res = await client.post('/lister/verification/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return res.data
}

// Admin
export interface AdminVerification {
  id: string
  user_id: string
  name: string | null
  email: string | null
  phone: string | null
  id_type: string
  front_url: string
  back_url: string | null
  status: string
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
}

export const getAdminVerifications = async (status: string): Promise<{ verifications: AdminVerification[]; total: number }> => {
  const res = await client.get('/admin/verifications', { params: { status } })
  return res.data
}

export const approveVerification = async (id: string) => {
  const res = await client.post(`/admin/verifications/${id}/approve`)
  return res.data
}

export const rejectVerification = async (id: string, reason: string) => {
  const res = await client.post(`/admin/verifications/${id}/reject`, { reason })
  return res.data
}
