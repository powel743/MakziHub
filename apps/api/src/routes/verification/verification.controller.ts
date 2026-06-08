import { FastifyRequest, FastifyReply } from 'fastify'
import { submitVerification, getVerificationStatus } from './verification.service'
import { unprocessable } from '../../utils/errors'

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_BYTES = 5 * 1024 * 1024
const ID_TYPES = ['national_id', 'passport', 'driving_licence']

export async function uploadVerificationHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub
  let idType: string | undefined
  let front: Buffer | undefined
  let back: Buffer | undefined

  // Iterate multipart parts: id_type (field), id_front + id_back (files)
  const parts = request.parts()
  for await (const part of parts) {
    if (part.type === 'file') {
      const buf = await part.toBuffer()
      if (!ALLOWED_MIME.includes(part.mimetype)) {
        throw unprocessable('Files must be JPG, PNG, or PDF')
      }
      if (buf.length > MAX_BYTES) {
        throw unprocessable('Each file must be under 5MB')
      }
      if (part.fieldname === 'id_front') front = buf
      else if (part.fieldname === 'id_back') back = buf
    } else if (part.fieldname === 'id_type') {
      idType = String(part.value)
    }
  }

  if (!idType || !ID_TYPES.includes(idType)) {
    throw unprocessable('id_type must be one of: national_id, passport, driving_licence')
  }
  if (!front) throw unprocessable('id_front file is required')

  const result = await submitVerification(userId, { idType, front, back })
  reply.send(result)
}

export async function verificationStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await getVerificationStatus(request.user.sub)
  reply.send(result)
}
