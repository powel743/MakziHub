import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { sendSms } from '../../services/africasTalking.service'
import { smsTemplates } from '../../services/sms-templates'
import logger from '../../utils/logger'

interface CsvRow {
  title: string
  estate: string
  address: string
  rent_ksh: number
  deposit_ksh?: number
  house_type: string
  bedrooms: number
  bathrooms: number
  size_sqft?: number
  available_from: string
  amenities?: string[]
  photo_urls?: string[]
}

interface CsvImportData {
  agencyId: string
  listerUserId: string
  importSessionId: string
  rows: CsvRow[]
}

const BATCH_SIZE = 50

export async function csvImportProcessor(job: Job<CsvImportData>): Promise<void> {
  const { agencyId, listerUserId, importSessionId, rows } = job.data

  logger.info({ importSessionId, totalRows: rows.length }, 'Starting CSV import')

  await supabaseAdmin
    .from('import_sessions')
    .update({ status: 'processing' })
    .eq('id', importSessionId)

  let importedCount = 0
  const errors: Array<{ row: number; error: string }> = []

  // Process in batches of 50
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j]
      const rowIndex = i + j + 1

      try {
        const { data: listing, error: listingError } = await supabaseAdmin
          .from('listings')
          .insert({
            lister_user_id: listerUserId,
            agency_id: agencyId,
            title: row.title,
            estate: row.estate,
            address: row.address,
            rent_ksh: row.rent_ksh,
            deposit_ksh: row.deposit_ksh,
            house_type: row.house_type,
            bedrooms: row.bedrooms,
            bathrooms: row.bathrooms,
            size_sqft: row.size_sqft,
            available_from: row.available_from,
            status: 'available',
            verified_tier: 'phone',
          })
          .select('id')
          .single()

        if (listingError) throw listingError

        // Insert amenities
        if (row.amenities && row.amenities.length > 0 && listing) {
          await supabaseAdmin.from('listing_amenities').insert(
            row.amenities.map((amenity) => ({
              listing_id: listing.id,
              amenity,
            }))
          )
        }

        // Insert photos
        if (row.photo_urls && row.photo_urls.length > 0 && listing) {
          await supabaseAdmin.from('listing_photos').insert(
            row.photo_urls.slice(0, 10).map((url, order) => ({
              listing_id: listing.id,
              url,
              order,
            }))
          )
        }

        importedCount++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push({ row: rowIndex, error: errorMsg })
        logger.warn({ rowIndex, error: errorMsg }, 'Failed to import CSV row')
      }
    }

    // Update progress
    await supabaseAdmin
      .from('import_sessions')
      .update({ imported_count: importedCount })
      .eq('id', importSessionId)
  }

  // Mark import complete
  await supabaseAdmin
    .from('import_sessions')
    .update({
      status: 'complete',
      imported_count: importedCount,
      error_rows: errors.length,
      error_details: errors,
    })
    .eq('id', importSessionId)

  // Notify the lister
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('id', listerUserId)
    .single()

  if (user?.phone) {
    await sendSms({
      to: user.phone,
      message: smsTemplates.csvImportComplete(importedCount, errors.length),
      template: 'csvImportComplete',
    })
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: listerUserId,
    type: 'csv_import_complete',
    title: 'Import Complete',
    body: smsTemplates.csvImportComplete(importedCount, errors.length),
    metadata: { import_session_id: importSessionId, errors },
  })

  logger.info({ importSessionId, importedCount, errorCount: errors.length }, 'CSV import complete')
}
