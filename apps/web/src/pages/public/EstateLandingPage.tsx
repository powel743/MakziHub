import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MapPin, ArrowRight } from 'lucide-react'
import { useListings } from '../../hooks/useListings'
import { ListingGrid } from '../../components/listings/ListingGrid'
import { Pagination } from '../../components/ui/Pagination'
import { buildEstateMeta } from '../../utils/seo'
import { useState } from 'react'

export default function EstateLandingPage() {
  const { estate } = useParams<{ estate: string }>()
  const [page, setPage] = useState(1)
  const { listings, pagination, isLoading } = useListings({ estate: estate!, page, limit: 12 })
  const meta = buildEstateMeta(estate!)

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
      </Helmet>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <Link to="/" className="hover:text-white">Home</Link> /
            <Link to="/listings" className="hover:text-white">Listings</Link> /
            <span className="text-white">{estate}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-7 h-7 text-green-400" />
            <h1 className="text-3xl sm:text-4xl font-bold font-display">Houses for Rent in {estate}</h1>
          </div>
          <p className="text-gray-300 max-w-xl">
            {meta.description}
          </p>
          {pagination && (
            <p className="text-green-400 font-medium mt-3">{pagination.total} listings available</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All listings in {estate}</h2>
          <Link
            to={`/listings?estate=${encodeURIComponent(estate!)}`}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View with filters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <ListingGrid listings={listings} isLoading={isLoading} />
        {pagination && (
          <Pagination page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
        )}
      </div>
    </>
  )
}
