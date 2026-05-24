import { Job } from 'bullmq'
import { supabaseAdmin } from '../../config/supabase'
import { APPROVED_ESTATES } from '../../db/client'
import { env } from '../../config/env'
import logger from '../../utils/logger'
import fs from 'fs/promises'
import path from 'path'

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function sitemapGeneratorProcessor(job: Job): Promise<void> {
  logger.info({ jobId: job.id }, 'Generating sitemap')

  const baseUrl = env.FRONTEND_URL

  // Fetch all available listing IDs
  const { data: listings, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'available')

  if (listingError) {
    logger.error({ error: listingError }, 'Failed to fetch listings for sitemap')
    throw listingError
  }

  // Fetch all agency IDs
  const { data: agencies, error: agencyError } = await supabaseAdmin
    .from('agencies')
    .select('id, updated_at')
    .eq('verified', true)

  if (agencyError) {
    logger.error({ error: agencyError }, 'Failed to fetch agencies for sitemap')
    throw agencyError
  }

  const urls: string[] = []
  const now = new Date().toISOString()

  // Static pages
  urls.push(`<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`)
  urls.push(`<url><loc>${baseUrl}/listings</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`)

  // Estate landing pages
  for (const estate of APPROVED_ESTATES) {
    const slug = slugify(estate)
    urls.push(
      `<url><loc>${baseUrl}/listings?estate=${encodeURIComponent(estate)}</loc>` +
      `<changefreq>daily</changefreq><priority>0.8</priority></url>`
    )
  }

  // Listing detail pages
  for (const listing of listings ?? []) {
    urls.push(
      `<url><loc>${baseUrl}/listings/${listing.id}</loc>` +
      `<lastmod>${listing.updated_at}</lastmod>` +
      `<changefreq>weekly</changefreq><priority>0.7</priority></url>`
    )
  }

  // Agency profile pages
  for (const agency of agencies ?? []) {
    urls.push(
      `<url><loc>${baseUrl}/agencies/${agency.id}</loc>` +
      `<lastmod>${agency.updated_at}</lastmod>` +
      `<changefreq>weekly</changefreq><priority>0.6</priority></url>`
    )
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  // Write to public directory
  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml')
  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, sitemap, 'utf-8')
    logger.info({ path: outputPath, urls: urls.length }, 'Sitemap written to disk')
  } catch (writeError) {
    logger.error({ writeError }, 'Failed to write sitemap to disk')
    throw writeError
  }
}
