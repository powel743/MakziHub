import { FastifyRequest, FastifyReply } from 'fastify'
import { createListingSchema, updateListingSchema, listingsQuerySchema } from './listings.schema'
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  toggleSave,
} from './listings.service'
import { uploadImage } from '../../services/cloudinary.service'
import { supabaseAdmin } from '../../config/supabase'
import { deleteImage } from '../../services/cloudinary.service'
import { notFound, forbidden, unprocessable } from '../../utils/errors'
import { fraudAggregatorQueue } from '../../jobs/queue'
import { initiateBoost } from '../payments/payments.service'

export async function getListingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listingsQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }
  const result = await getListings(parsed.data)
  reply.send(result)
}

export async function getListingByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const userId = request.user?.sub
  const result = await getListingById(id, userId)
  if ('statusCode' in result) {
    return reply.status(result.statusCode ?? 500).send({ error: result.error, code: result.code })
  }
  reply.send(result)
}

export async function createListingHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createListingSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }
  const result = await createListing(parsed.data, request.user.sub, request.user.role)
  reply.status(201).send(result)
}

export async function updateListingHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const parsed = updateListingSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }
  const result = await updateListing(id, parsed.data, request.user.sub, request.user.role)
  reply.send(result)
}

export async function deleteListingHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  await deleteListing(id, request.user.sub, request.user.role)
  reply.status(204).send()
}

export async function uploadPhotoHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  // Check ownership
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('id, lister_user_id')
    .eq('id', id)
    .single()
  if (!listing) throw notFound('Listing not found')
  if (listing.lister_user_id !== request.user.sub && request.user.role !== 'admin') {
    throw forbidden('You do not own this listing')
  }

  // Check photo count
  const { count } = await supabaseAdmin
    .from('listing_photos')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', id)
  if ((count ?? 0) >= 10) {
    throw unprocessable('Maximum of 10 photos per listing')
  }

  const data = await request.file()
  if (!data) throw unprocessable('No file provided')

  const buffer = await data.toBuffer()
  const uploaded = await uploadImage(buffer, { folder: `makazihub/listings/${id}` })

  const { data: photo, error } = await supabaseAdmin
    .from('listing_photos')
    .insert({
      listing_id: id,
      url: uploaded.secureUrl,
      cloudinary_public_id: uploaded.publicId,
      order: count ?? 0,
    })
    .select()
    .single()

  if (error) throw unprocessable(error.message)
  reply.status(201).send(photo)
}

export async function deletePhotoHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, photo_id } = request.params as { id: string; photo_id: string }

  const { data: photo } = await supabaseAdmin
    .from('listing_photos')
    .select('id, listing_id, cloudinary_public_id, listings!listing_id(lister_user_id)')
    .eq('id', photo_id)
    .eq('listing_id', id)
    .single()

  if (!photo) throw notFound('Photo not found')

  const lister = photo.listings as unknown as { lister_user_id: string } | null
  if (lister?.lister_user_id !== request.user.sub && request.user.role !== 'admin') {
    throw forbidden('You do not own this listing')
  }

  if (photo.cloudinary_public_id) {
    await deleteImage(photo.cloudinary_public_id)
  }
  await supabaseAdmin.from('listing_photos').delete().eq('id', photo_id)
  reply.status(204).send()
}

export async function toggleSaveHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const result = await toggleSave(id, request.user.sub)
  reply.send(result)
}

export async function boostListingHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { plan } = request.body as { plan?: string }
  if (!plan || !['7day', '14day', '30day'].includes(plan)) {
    throw unprocessable('plan must be one of: 7day, 14day, 30day')
  }
  const result = await initiateBoost(id, plan, request.user.sub, request.user.role)
  reply.status(202).send(result)
}

export async function reportListingHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { reason, note } = request.body as { reason: string; note?: string }

  const validReasons = ['fraud', 'misleading', 'already_taken', 'other']
  if (!validReasons.includes(reason)) {
    throw unprocessable(`reason must be one of: ${validReasons.join(', ')}`)
  }

  const { data: existing } = await supabaseAdmin
    .from('listings')
    .select('id')
    .eq('id', id)
    .single()
  if (!existing) throw notFound('Listing not found')

  const { data: report, error } = await supabaseAdmin
    .from('fraud_reports')
    .insert({
      listing_id: id,
      reporter_user_id: request.user.sub,
      reason,
      note,
    })
    .select()
    .single()

  if (error) throw unprocessable(error.message)

  // Queue fraud aggregation
  await fraudAggregatorQueue.add('fraud-report-aggregator', { listingId: id })

  reply.status(201).send({ message: 'Report submitted', report_id: report.id })
}
