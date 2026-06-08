import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../utils/constants'

export interface SeoMetaOptions {
  title: string
  description: string
  /** Path beginning with "/" — combined with SITE_URL for the canonical URL */
  canonicalPath: string
  image?: string
  /** og:type — "website" (default) or "article" (e.g. future blog) */
  type?: 'website' | 'article'
}

/**
 * Centralised SEO head tags: title, description, canonical, hreflang (en-KE),
 * Open Graph and Twitter card. Returns a <Helmet> element — render it in JSX:
 *   return <>{useSeoMeta({ title, description, canonicalPath: '/listings' })}...</>
 */
export function useSeoMeta({ title, description, canonicalPath, image, type = 'website' }: SeoMetaOptions) {
  const url = `${SITE_URL}${canonicalPath}`
  const img = image || `${SITE_URL}/og-default.png`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="en-KE" href={url} />
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="en_KE" />
      <meta property="og:site_name" content="MakaziHub" />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@MakaziHub" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  )
}
