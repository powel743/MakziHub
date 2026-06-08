import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../../utils/constants'

interface EstateJsonLdProps {
  estate: {
    name: string
    slug?: string
    description?: string | null
    lat?: number
    lng?: number
  }
  listingIds?: string[]
}

/**
 * Place structured data (schema.org) for an estate landing page.
 */
export function EstateJsonLd({ estate, listingIds = [] }: EstateJsonLdProps) {
  const slug = estate.slug ?? estate.name.toLowerCase().replace(/\s+/g, '-')

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${estate.name}, Nairobi`,
    description:
      estate.description ?? `Rental houses and apartments for rent in ${estate.name}, Nairobi.`,
    url: `${SITE_URL}/estates/${slug}`,
    ...(estate.lat != null && estate.lng != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: estate.lat, longitude: estate.lng } }
      : {}),
    ...(listingIds.length > 0
      ? {
          containsPlace: listingIds.map((id) => ({
            '@type': 'RealEstateListing',
            url: `${SITE_URL}/listings/${id}`,
          })),
        }
      : {}),
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}
