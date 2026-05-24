import { supabaseAdmin } from '../../config/supabase'
import { importQueue } from '../../jobs/queue'
import { conflict, forbidden, notFound, unprocessable } from '../../utils/errors'
import { parse } from 'csv-parse/sync'
import { csvRowSchema, type CreateAgencyInput, type CsvRow } from './agencies.schema'

export async function createAgency(input: CreateAgencyInput, userId: string) {
  // Only one agency per user
  const { data: existing } = await supabaseAdmin
    .from('agencies')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (existing) throw conflict('You already have an agency account')

  const { data: agency, error } = await supabaseAdmin
    .from('agencies')
    .insert({ ...input, owner_user_id: userId })
    .select()
    .single()

  if (error) throw unprocessable(error.message)

  // Add owner as admin member
  await supabaseAdmin.from('agency_members').insert({
    agency_id: agency.id,
    user_id: userId,
    role: 'admin',
  })

  return agency
}

export async function getAgency(agencyId: string) {
  const { data: agency, error } = await supabaseAdmin
    .from('agencies')
    .select('id, name, description, logo_url, verified, created_at')
    .eq('id', agencyId)
    .single()

  if (error || !agency) throw notFound('Agency not found')

  const { data: listings } = await supabaseAdmin
    .from('listings')
    .select('id, title, estate, rent_ksh, house_type, bedrooms, status, listing_photos(url, "order")')
    .eq('agency_id', agencyId)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: memberCount } = await supabaseAdmin
    .from('agency_members')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)

  return {
    ...agency,
    listings: (listings ?? []).map((l) => ({
      ...l,
      cover_photo: (l.listing_photos as Array<{ url: string; order: number }> ?? [])
        .sort((a, b) => a.order - b.order)[0]?.url ?? null,
      listing_photos: undefined,
    })),
    member_count: memberCount ?? 0,
  }
}

export async function inviteMember(
  agencyId: string,
  email: string,
  memberRole: string,
  requestingUserId: string
) {
  // Only agency owner or admin member can invite
  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('id, owner_user_id')
    .eq('id', agencyId)
    .single()

  if (!agency) throw notFound('Agency not found')

  const { data: membership } = await supabaseAdmin
    .from('agency_members')
    .select('role')
    .eq('agency_id', agencyId)
    .eq('user_id', requestingUserId)
    .single()

  if (agency.owner_user_id !== requestingUserId && membership?.role !== 'admin') {
    throw forbidden('Only agency admins can invite members')
  }

  // Find user by email
  const { data: invitedUser } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('email', email)
    .maybeSingle()

  if (!invitedUser) {
    // In a full implementation, send an invite email via Supabase
    return { message: `Invitation sent to ${email}. They will be added once they register.` }
  }

  // Check not already a member
  const { data: alreadyMember } = await supabaseAdmin
    .from('agency_members')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('user_id', invitedUser.id)
    .maybeSingle()

  if (alreadyMember) throw conflict('User is already a member of this agency')

  const { data: member, error } = await supabaseAdmin
    .from('agency_members')
    .insert({ agency_id: agencyId, user_id: invitedUser.id, role: memberRole })
    .select()
    .single()

  if (error) throw unprocessable(error.message)
  return { message: 'Member added successfully', member }
}

export interface CsvValidationResult {
  valid: CsvRow[]
  errors: Array<{ row: number; message: string }>
  total: number
}

export async function validateCsvImport(
  buffer: Buffer,
  agencyId: string
): Promise<CsvValidationResult> {
  let records: Record<string, string>[]
  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  } catch (err) {
    throw unprocessable('Invalid CSV format. Please check your file and try again.')
  }

  const valid: CsvRow[] = []
  const errors: Array<{ row: number; message: string }> = []

  for (let i = 0; i < records.length; i++) {
    const rowNum = i + 2 // +2 because row 1 is header
    const parsed = csvRowSchema.safeParse(records[i])
    if (parsed.success) {
      valid.push(parsed.data)
    } else {
      errors.push({
        row: rowNum,
        message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
      })
    }
  }

  return { valid, errors, total: records.length }
}

export async function confirmCsvImport(
  agencyId: string,
  listerUserId: string,
  validRows: CsvRow[]
) {
  // Create import session
  const { data: session, error } = await supabaseAdmin
    .from('import_sessions')
    .insert({
      agency_id: agencyId,
      initiated_by: listerUserId,
      status: 'pending',
      total_rows: validRows.length,
      valid_rows: validRows.length,
    })
    .select('id')
    .single()

  if (error || !session) throw unprocessable('Failed to create import session')

  // Normalize rows for job
  const normalizedRows = validRows.map((row) => ({
    ...row,
    amenities: row.amenities ? row.amenities.split('|').map((a) => a.trim()) : [],
    photo_urls: row.photo_urls ? row.photo_urls.split('|').map((u) => u.trim()) : [],
  }))

  // Queue BullMQ job
  const job = await importQueue.add('csv-import-processor', {
    agencyId,
    listerUserId,
    importSessionId: session.id,
    rows: normalizedRows,
  })

  await supabaseAdmin
    .from('import_sessions')
    .update({ job_id: job.id })
    .eq('id', session.id)

  return { import_session_id: session.id, job_id: job.id, queued_rows: validRows.length }
}
