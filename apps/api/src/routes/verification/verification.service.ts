import { supabaseAdmin } from '../../config/supabase'
import { uploadImage } from '../../services/cloudinary.service'
import { sendSms } from '../../services/africasTalking.service'
import { unprocessable } from '../../utils/errors'

export interface VerificationUploadInput {
  idType: string
  front: Buffer
  back?: Buffer
}

const VERIFICATION_FOLDER = 'makazi/verifications'

export async function submitVerification(userId: string, input: VerificationUploadInput) {
  const front = await uploadImage(input.front, {
    folder: VERIFICATION_FOLDER,
    resourceType: 'auto',
  })

  let backUrl: string | null = null
  if (input.back) {
    const back = await uploadImage(input.back, {
      folder: VERIFICATION_FOLDER,
      resourceType: 'auto',
    })
    backUrl = back.secureUrl
  }

  const { data: verification, error } = await supabaseAdmin
    .from('verifications')
    .insert({
      user_id: userId,
      id_type: input.idType,
      front_url: front.secureUrl,
      back_url: backUrl,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !verification) {
    throw unprocessable(error?.message ?? 'Failed to submit verification')
  }

  await supabaseAdmin
    .from('lister_profiles')
    .update({ verification_status: 'pending' })
    .eq('user_id', userId)

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('id', userId)
    .single()
  if (user?.phone) {
    await sendSms({
      to: user.phone,
      message: "Your ID verification has been submitted. You'll be notified within 24 hours.",
      template: 'verificationSubmitted',
    })
  }

  return { message: 'Submitted', verification_id: verification.id }
}

export async function getVerificationStatus(userId: string) {
  const { data: latest } = await supabaseAdmin
    .from('verifications')
    .select('id, id_type, status, rejection_reason, submitted_at, reviewed_at')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: profile } = await supabaseAdmin
    .from('lister_profiles')
    .select('id_verified, verification_status')
    .eq('user_id', userId)
    .single()

  // Derive the UI state machine value
  let status: 'unverified' | 'pending' | 'verified' | 'rejected' = 'unverified'
  if (profile?.id_verified) status = 'verified'
  else if (latest?.status === 'pending') status = 'pending'
  else if (latest?.status === 'rejected') status = 'rejected'

  return {
    status,
    id_verified: profile?.id_verified ?? false,
    latest: latest ?? null,
  }
}
