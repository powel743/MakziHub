import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../../utils/constants'

export interface Crumb {
  name: string
  path: string
}

/**
 * BreadcrumbList structured data. Pair with a visible breadcrumb nav for UX + SEO.
 */
export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  }
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}
