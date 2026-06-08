/**
 * Build-time route discovery for react-snap + sitemap.xml.
 *
 * react-snap only prerenders routes it knows about. This script collects the
 * static routes, every estate landing page, and up to 500 recent listing detail
 * pages, then:
 *   1. writes snap-routes.json (for reference)
 *   2. injects them into package.json `reactSnap.include` (what react-snap reads)
 *   3. writes public/sitemap.xml served at the site root
 *
 * Dynamic listing IDs are fetched from the public API. The frontend never talks
 * to Supabase directly (PRD §4.2), so we use the API as the data source. If the
 * API is unreachable at build time, we fall back to static + estate routes so
 * the build never fails.
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { APPROVED_ESTATES } from '../src/utils/constants'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WEB_ROOT = join(__dirname, '..')

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.makazihub.co.ke'
const API_URL = process.env.VITE_API_URL || process.env.API_BASE_URL || 'http://localhost:3000/v1'
const MAX_LISTINGS = 500

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function fetchListingIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/listings?limit=${MAX_LISTINGS}&sort=newest`)
    if (!res.ok) throw new Error(`API responded ${res.status}`)
    const data = (await res.json()) as { listings?: Array<{ id: string }> }
    return (data.listings ?? []).map((l) => l.id).slice(0, MAX_LISTINGS)
  } catch (err) {
    console.warn(`[snap-routes] Could not fetch listings from ${API_URL}: ${(err as Error).message}`)
    console.warn('[snap-routes] Falling back to static + estate routes only.')
    return []
  }
}

async function main() {
  const staticRoutes = ['/', '/listings', '/about', '/contact']
  const estateRoutes = APPROVED_ESTATES.map((name) => `/estates/${slugify(name)}`)
  const listingIds = await fetchListingIds()
  const listingRoutes = listingIds.map((id) => `/listings/${id}`)

  const routes = [...new Set([...staticRoutes, ...estateRoutes, ...listingRoutes])]

  // 1. snap-routes.json
  writeFileSync(join(WEB_ROOT, 'snap-routes.json'), JSON.stringify(routes, null, 2))

  // 2. inject into package.json reactSnap.include (react-snap reads this)
  const pkgPath = join(WEB_ROOT, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.reactSnap = { ...(pkg.reactSnap ?? {}), include: routes }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  // 3. sitemap.xml at the site root (public/ is copied verbatim to the build)
  const today = new Date().toISOString().slice(0, 10)
  const urlEntries = [
    `<url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${SITE_URL}/listings</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`,
    ...estateRoutes.map(
      (r) => `<url><loc>${SITE_URL}${r}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
    ),
    ...listingRoutes.map(
      (r) => `<url><loc>${SITE_URL}${r}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    ),
  ]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join('\n')}\n</urlset>\n`
  writeFileSync(join(WEB_ROOT, 'public', 'sitemap.xml'), sitemap)

  console.log(`[snap-routes] ${routes.length} routes (${estateRoutes.length} estates, ${listingRoutes.length} listings) → snap-routes.json, package.json, sitemap.xml`)
}

main()
