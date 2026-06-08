import { useParams, Link } from 'react-router-dom'
import { MapPin, ArrowRight, Bus, GraduationCap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useListings } from '../../hooks/useListings'
import { ListingGrid } from '../../components/listings/ListingGrid'
import { Pagination } from '../../components/ui/Pagination'
import { buildEstateMeta } from '../../utils/seo'
import { useSeoMeta } from '../../hooks/useSeoMeta'
import { EstateJsonLd } from '../../components/seo/EstateJsonLd'
import { BreadcrumbJsonLd } from '../../components/seo/BreadcrumbJsonLd'
import { getEstate } from '../../api/estates.api'
import { APPROVED_ESTATES } from '../../utils/constants'
import { useState } from 'react'

export default function EstateLandingPage() {
  const { estate: param } = useParams<{ estate: string }>()
  const [page, setPage] = useState(1)

  const { data: estateData } = useQuery({
    queryKey: ['estate', param],
    queryFn: () => getEstate(param!),
    retry: false,
    enabled: !!param,
  })

  // Resolve the canonical estate name (param may be a slug) for listing filtering
  const estateName = estateData?.name ?? param!
  const { listings, pagination, isLoading } = useListings({ estate: estateName, page, limit: 12 })
  const meta = buildEstateMeta(estateName, pagination?.total)

  const relatedEstates = APPROVED_ESTATES
    .filter((e) => e.toLowerCase() !== estateName.toLowerCase())
    .slice(0, 3)

  return (
    <>
      {useSeoMeta({
        title: meta.title,
        description: estateData?.seo_meta_description || meta.description,
        canonicalPath: `/estates/${param}`,
      })}
      <EstateJsonLd
        estate={{ name: estateName, slug: estateData?.slug, description: estateData?.description }}
        listingIds={listings.map((l) => l.id)}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Estates', path: '/listings' },
          { name: estateName, path: `/estates/${param}` },
        ]}
      />

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <Link to="/" className="hover:text-white">Home</Link> /
            <Link to="/listings" className="hover:text-white">Listings</Link> /
            <span className="text-white">{estateName}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-7 h-7 text-green-400" />
            <h1 className="text-3xl sm:text-4xl font-bold font-display">Houses for Rent in {estateName}</h1>
          </div>
          <p className="text-gray-300 max-w-xl">{meta.description}</p>
          {pagination && (
            <p className="text-green-400 font-medium mt-3">{pagination.total} listings available</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All listings in {estateName}</h2>
          <Link
            to={`/listings?estate=${encodeURIComponent(estateName)}`}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View with filters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <ListingGrid listings={listings} isLoading={isLoading} />
        {pagination && (
          <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} />
        )}

        {/* About {estate} — unique SEO content (PRD §9.4) */}
        <section className="mt-12 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About {estateName}</h2>
          {estateData?.description ? (
            <p className="text-gray-600 leading-relaxed">{estateData.description}</p>
          ) : (
            <p className="text-gray-400 italic">Content coming soon — help us improve this page.</p>
          )}

          {estateData?.transport_links && estateData.transport_links.length > 0 && (
            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Bus className="w-4 h-4 text-primary" /> Transport links
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {estateData.transport_links.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          )}

          {estateData?.nearby_schools && estateData.nearby_schools.length > 0 && (
            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <GraduationCap className="w-4 h-4 text-primary" /> Nearby schools
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {estateData.nearby_schools.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
        </section>

        {/* Internal linking — nearby estates + browse all */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Explore other estates</h2>
            <Link to="/listings" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Browse all estates <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedEstates.map((e) => (
              <Link
                key={e}
                to={`/estates/${encodeURIComponent(e)}`}
                className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                Houses in {e}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
