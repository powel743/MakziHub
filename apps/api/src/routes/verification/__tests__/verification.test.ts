import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Service-level tests for the verification flow. The HTTP route guards
 * (requireAuth / requireRole) are the shared middleware used across every
 * protected route; these tests cover the new business logic that the
 * upload / status / approve / reject endpoints delegate to.
 */
const { queue, updates, inserts, supabase } = vi.hoisted(() => {
  const queue: any[] = []
  const updates: any[] = []
  const inserts: any[] = []
  const make = () => {
    const b: any = {}
    const methods = ['select', 'eq', 'gte', 'lt', 'lte', 'not', 'or', 'order', 'range', 'in', 'limit', 'single', 'maybeSingle', 'delete']
    for (const m of methods) b[m] = () => b
    b.update = (p: any) => { updates.push(p); return b }
    b.insert = (p: any) => { inserts.push(p); return b }
    b.then = (resolve: any, reject: any) =>
      Promise.resolve().then(() => queue.shift() ?? { data: null, error: null, count: 0 }).then(resolve, reject)
    return b
  }
  return { queue, updates, inserts, supabase: { from: () => make() } }
})

vi.mock('../../../config/supabase', () => ({ supabaseAdmin: supabase }))
vi.mock('../../../services/cloudinary.service', () => ({
  uploadImage: vi.fn().mockResolvedValue({ secureUrl: 'http://img', publicId: 'p' }),
}))
vi.mock('../../../services/africasTalking.service', () => ({ sendSms: vi.fn().mockResolvedValue({ success: true }) }))

import { submitVerification, getVerificationStatus } from '../verification.service'
import { approveVerification, rejectVerification } from '../../admin/admin.service'
import { uploadImage } from '../../../services/cloudinary.service'
import { sendSms } from '../../../services/africasTalking.service'

beforeEach(() => {
  queue.length = 0
  updates.length = 0
  inserts.length = 0
  vi.clearAllMocks()
})

describe('submitVerification', () => {
  it('uploads docs, inserts a pending verification and returns the id', async () => {
    queue.push(
      { data: { id: 'v1' }, error: null }, // insert verification
      { data: null, error: null }, // update lister_profiles
      { data: { phone: '0722345678' } } // fetch user phone
    )

    const res = await submitVerification('user-1', {
      idType: 'national_id',
      front: Buffer.from('front'),
      back: Buffer.from('back'),
    })

    expect(res).toEqual({ message: 'Submitted', verification_id: 'v1' })
    expect(uploadImage).toHaveBeenCalledTimes(2) // front + back
    expect(inserts[0]).toMatchObject({ user_id: 'user-1', id_type: 'national_id', status: 'pending' })
    expect(updates[0]).toMatchObject({ verification_status: 'pending' })
    expect(sendSms).toHaveBeenCalledTimes(1)
  })
})

describe('getVerificationStatus', () => {
  it('derives pending state from the latest verification', async () => {
    queue.push(
      { data: { id: 'v1', id_type: 'national_id', status: 'pending', rejection_reason: null, submitted_at: 'x', reviewed_at: null } },
      { data: { id_verified: false, verification_status: 'pending' } }
    )

    const res = await getVerificationStatus('user-1')
    expect(res.status).toBe('pending')
    expect(res.id_verified).toBe(false)
    expect(res.latest).not.toBeNull()
  })

  it('reports verified when the profile is id_verified', async () => {
    queue.push(
      { data: { id: 'v1', status: 'approved' } },
      { data: { id_verified: true, verification_status: 'verified' } }
    )
    const res = await getVerificationStatus('user-1')
    expect(res.status).toBe('verified')
    expect(res.id_verified).toBe(true)
  })
})

describe('approveVerification', () => {
  it('marks the profile id_verified and notifies the lister', async () => {
    queue.push(
      { data: { id: 'v1', user_id: 'u1' } }, // fetch verification
      { data: null }, // update verification
      { data: null }, // update lister_profiles
      { data: { phone: '0722345678' } } // fetch phone
    )

    const res = await approveVerification('v1', 'admin-1')
    expect(res).toEqual({ message: 'Approved' })
    expect(updates.some((u) => u.id_verified === true && u.verification_status === 'verified')).toBe(true)
    expect(sendSms).toHaveBeenCalledTimes(1)
  })
})

describe('rejectVerification', () => {
  it('requires a reason', async () => {
    await expect(rejectVerification('v1', '', 'admin-1')).rejects.toThrow()
  })

  it('records the rejection reason and sets status rejected', async () => {
    queue.push(
      { data: { id: 'v1', user_id: 'u1' } }, // fetch verification
      { data: null }, // update verification
      { data: null }, // update lister_profiles
      { data: { phone: '0722345678' } } // fetch phone
    )
    const res = await rejectVerification('v1', 'Blurry photo', 'admin-1')
    expect(res).toEqual({ message: 'Rejected' })
    expect(updates.some((u) => u.verification_status === 'rejected')).toBe(true)
    expect(updates.some((u) => u.rejection_reason === 'Blurry photo')).toBe(true)
  })
})
