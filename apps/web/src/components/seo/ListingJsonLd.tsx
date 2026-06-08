import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../../utils/constants'

interface ListingJsonLdProps {
  listing: {
    id: string
    title: string
    description?: string
    estate: string
    bedrooms?: number
    size_sqft?: number | null
    rent_ksh?: number
    rent?: number
    amenities?: Array<string | { amenity: string }>
    photos?: Array<{ url: string }>
    cover_photo_url?: string | null
    lister?: { name?: string; display_name?: string; id_verified?: boolean } | null
  }
}

function amenityName(a: string | { amenity: string }): string {
  return (typeof a === 'string' ? a : a.amenity).replace(/_/g, ' ')
}

/**
 * RealEstateListing structured data (schema.org) for the listing detail page.
 */
export function ListingJsonLd({ listing }: ListingJsonLdProps) {
  const price = listing.rent_ksh ?? listing.rent ?? 0
  const photos = listing.photos ?? []
  const cover = photos[0]?.url ?? listing.cover_photo_url ?? undefined
  const listerName = listing.lister?.display_name ?? listing.lister?.name

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description,
    url: `${SITE_URL}/listings/${listing.id}`,
    offers: { '@type': 'Offer', price, priceCurrency: 'KES' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.estate,
      addressRegion: 'Nairobi',
      addressCountry: 'KE',
    },
  }

  if (listing.bedrooms != null) data.numberOfRooms = listing.bedrooms
  if (listing.size_sqft) {
    data.floorSize = { '@type': 'QuantitativeValue', value: listing.size_sqft, unitCode: 'FTK' }
  }
  if (listing.amenities && listing.amenities.length > 0) {
    data.amenityFeature = listing.amenities.map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenityName(a),
      value: true,
    }))
  }
  if (listerName) {
    data.landlord = {
      '@type': 'Person',
      name: listerName,
      identifier: listing.lister?.id_verified ? 'verified' : 'unverified',
    }
  }
  if (photos.length > 0) {
    data.photo = photos.map((p) => ({ '@type': 'ImageObject', url: p.url, caption: listing.title }))
  } else if (cover) {
    data.image = cover
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}
