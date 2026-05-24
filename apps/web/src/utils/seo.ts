import type { Listing } from './constants'

export interface MetaTags {
  title: string
  description: string
  ogImage?: string
  ogUrl?: string
}

export function buildListingMeta(listing: Listing): MetaTags {
  const houseType = listing.house_type.replace(/_/g, ' ')
  const bedLabel = listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} Bedroom`
  const price = `KES ${listing.rent.toLocaleString('en-KE')}`

  return {
    title: `${bedLabel} ${houseType} for Rent in ${listing.estate} — ${price}/mo | MakaziHub`,
    description: `Find a ${bedLabel.toLowerCase()} ${houseType} in ${listing.estate}, Nairobi for ${price}/month. View photos, amenities, and contact the caretaker on MakaziHub.`,
    ogImage: listing.photos?.[0]?.url || '/og-default.png',
  }
}

export function buildEstateMeta(estate: string): MetaTags {
  return {
    title: `Houses & Apartments for Rent in ${estate}, Nairobi | MakaziHub`,
    description: `Browse verified rental houses and apartments in ${estate}, Nairobi. Find bedsitters, 1, 2 and 3 bedroom homes with real photos and direct caretaker contacts on MakaziHub.`,
  }
}

export function buildListingsPageMeta(estate?: string): MetaTags {
  if (estate) {
    return buildEstateMeta(estate)
  }
  return {
    title: 'Houses for Rent in Nairobi | MakaziHub',
    description: 'Browse thousands of verified rental listings across Nairobi. Find bedsitters, apartments and houses with direct landlord contacts. No agent fees.',
  }
}
