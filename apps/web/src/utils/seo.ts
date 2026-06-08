export interface MetaTags {
  title: string
  description: string
  ogImage?: string
}

interface ListingLike {
  bedrooms: number
  estate: string
  area?: string | null
  house_type?: string
  rent_ksh?: number
  rent?: number
  amenities?: Array<string | { amenity: string }>
  photos?: Array<{ url: string }>
  cover_photo_url?: string | null
}

function bedLabel(bedrooms: number): string {
  return bedrooms === 0 ? 'Studio' : `${bedrooms}BR`
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function firstAmenity(amenities?: ListingLike['amenities']): string | null {
  if (!amenities || amenities.length === 0) return null
  const a = amenities[0]
  return humanize(typeof a === 'string' ? a : a.amenity)
}

// Listing detail: "2BR in Kilimani, Nairobi | Rent KES 45,000/mo — MakaziHub"
export function buildListingMeta(listing: ListingLike): MetaTags {
  const beds = bedLabel(listing.bedrooms)
  const area = listing.area || 'Nairobi'
  const price = (listing.rent_ksh ?? listing.rent ?? 0).toLocaleString('en-KE')
  const amenity = firstAmenity(listing.amenities)
  const image = listing.photos?.[0]?.url || listing.cover_photo_url || undefined

  return {
    title: `${beds} in ${listing.estate}, ${area} | Rent KES ${price}/mo — MakaziHub`,
    description:
      `Spacious ${beds} in ${listing.estate}. KES ${price}/mo.` +
      `${amenity ? ` ${amenity}.` : ''}` +
      ` Browse photos, verify the landlord, and unlock contact in one click.`,
    ogImage: image,
  }
}

// Estate landing: "Houses & Apartments for Rent in Karen | MakaziHub"
export function buildEstateMeta(estate: string, count?: number): MetaTags {
  const countText = count && count > 0 ? `${count} listings` : 'listings'
  return {
    title: `Houses & Apartments for Rent in ${estate} | MakaziHub`,
    description: `Find verified rental houses and apartments in ${estate}, Nairobi. Browse ${countText} with photos, prices, and direct landlord contact.`,
  }
}

export function buildHomeMeta(): MetaTags {
  return {
    title: 'Rent a House or Apartment in Nairobi | MakaziHub',
    description:
      'Browse verified rental homes across Nairobi estates. No agent fees. Unlock landlord contact instantly. Find your next home on MakaziHub.',
  }
}

export function buildListingsPageMeta(estate?: string, count?: number): MetaTags {
  if (estate) return buildEstateMeta(estate, count)
  return {
    title: 'Rental Properties in Nairobi | Filter by Estate & Price — MakaziHub',
    description:
      'Browse verified rental properties across Nairobi. Filter by estate, price and bedrooms. View photos and contact landlords directly on MakaziHub.',
  }
}

export function buildAgencyMeta(name: string): MetaTags {
  return {
    title: `${name} — Rental Listings in Nairobi | MakaziHub`,
    description: `Browse verified rental houses and apartments listed by ${name} in Nairobi. View photos, prices and contact the agency on MakaziHub.`,
  }
}
