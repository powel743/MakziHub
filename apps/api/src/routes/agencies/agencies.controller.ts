import { FastifyRequest, FastifyReply } from 'fastify'
import { createAgencySchema, inviteMemberSchema } from './agencies.schema'
import {
  createAgency,
  getAgency,
  inviteMember,
  getAgencyMembers,
  validateCsvImport,
  confirmCsvImport,
} from './agencies.service'
import { unprocessable, forbidden } from '../../utils/errors'
import { supabaseAdmin } from '../../config/supabase'

export async function createAgencyHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createAgencySchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }
  const result = await createAgency(parsed.data, request.user.sub)
  reply.status(201).send(result)
}

export async function getAgencyHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const result = await getAgency(id)
  reply.send(result)
}

export async function inviteMemberHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const parsed = inviteMemberSchema.safeParse(request.body)
  if (!parsed.success) {
    throw unprocessable(parsed.error.errors.map((e) => e.message).join(', '))
  }
  const result = await inviteMember(id, parsed.data.email, parsed.data.role, request.user.sub)
  reply.send(result)
}

export async function getMembersHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  // Only the agency owner or an existing member may view the team
  await assertAgencyMembership(id, request.user.sub)
  const members = await getAgencyMembers(id)
  reply.send({ members })
}

export async function importPreviewHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  // Verify user belongs to this agency
  await assertAgencyMembership(id, request.user.sub)

  const data = await request.file()
  if (!data) throw unprocessable('No CSV file provided')

  const buffer = await data.toBuffer()
  const result = await validateCsvImport(buffer, id)

  reply.send({
    preview: true,
    total: result.total,
    valid_count: result.valid.length,
    error_count: result.errors.length,
    errors: result.errors.slice(0, 20),
    sample_rows: result.valid.slice(0, 5),
    valid_rows: result.valid,
  })
}

export async function importConfirmHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  await assertAgencyMembership(id, request.user.sub)

  const body = request.body as { valid_rows?: unknown[] }
  if (!body.valid_rows || !Array.isArray(body.valid_rows) || body.valid_rows.length === 0) {
    throw unprocessable('valid_rows is required and must not be empty')
  }

  const result = await confirmCsvImport(id, request.user.sub, body.valid_rows as any)
  reply.status(202).send(result)
}

async function assertAgencyMembership(agencyId: string, userId: string) {
  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('owner_user_id')
    .eq('id', agencyId)
    .single()

  if (!agency) throw unprocessable('Agency not found')

  if (agency.owner_user_id !== userId) {
    const { data: member } = await supabaseAdmin
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', userId)
      .single()

    if (!member) throw forbidden('You are not a member of this agency')
  }
}
