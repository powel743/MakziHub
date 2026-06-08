import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../../utils/constants'

/**
 * LocalBusiness structured data for the homepage (Kenya local-SEO signal).
 */
export function LocalBusinessJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': SITE_URL,
    name: 'MakaziHub',
    description: 'Kenyan rental housing marketplace',
    url: SITE_URL,
    areaServed: { '@type': 'City', name: 'Nairobi' },
    priceRange: 'KES 5,000 – KES 500,000/month',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -1.286389,
      longitude: 36.817223,
    },
  }
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}
