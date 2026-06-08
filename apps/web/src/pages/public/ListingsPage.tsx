import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSeoMeta } from '../../hooks/useSeoMeta'
import { Map, Grid3X3 } from 'lucide-react'
import { useListings } from '../../hooks/useListings'
import { useListingsStore } from '../../store/listings.store'
import { ListingGrid } from '../../components/listings/ListingGrid'
import { ListingMap } from '../../components/listings/ListingMap'
import { ListingFiltersPanel } from '../../components/listings/ListingFilters'
import { Pagination } from '../../components/ui/Pagination'
import { buildListingsPageMeta } from '../../utils/seo'
import type { ListingFilters } from '../../utils/constants'

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, setFilters, resetFilters } = useListingsStore()
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  // Sync URL → store on mount
  useEffect(() => {
    const fromUrl: Partial<ListingFilters> = {}
    if (searchParams.get('estate')) fromUrl.estate = searchParams.get('estate')!
    if (searchParams.get('max_rent')) fromUrl.max_rent = Number(searchParams.get('max_rent'))
    if (searchParams.get('min_rent')) fromUrl.min_rent = Number(searchParams.get('min_rent'))
    if (searchParams.get('bedrooms')) fromUrl.bedrooms = Number(searchParams.get('bedrooms'))
    if (searchParams.get('house_type')) fromUrl.house_type = searchParams.get('house_type')!
    if (searchParams.get('sort')) fromUrl.sort = searchParams.get('sort') as ListingFilters['sort']
    if (searchParams.get('page')) fromUrl.page = Number(searchParams.get('page'))
    if (Object.keys(fromUrl).length > 0) setFilters(fromUrl)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync store → URL
  const handleFilterChange = (f: Partial<ListingFilters>) => {
    setFilters(f)
    const next = new URLSearchParams(searchParams)
    Object.entries({ ...filters, ...f }).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') next.set(k, String(v))
      else next.delete(k)
    })
    setSearchParams(next, { replace: true })
  }

  const handleReset = () => {
    resetFilters()
    setSearchParams({}, { replace: true })
  }

  const { listings, pagination, isLoading, isFetching } = useListings(filters)
  const meta = buildListingsPageMeta(filters.estate, pagination?.total)

  return (
    <>
      {useSeoMeta({ title: meta.title, description: meta.description, canonicalPath: '/listings' })}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-900">
              {filters.estate ? `Houses in ${filters.estate}` : 'All Listings'}
            </h1>
            {pagination && (
              <p className="text-sm text-gray-500 mt-0.5">
                Showing {listings.length} of {pagination.total} listings
                {filters.estate ? ` in ${filters.estate}` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title="Grid view"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title="Map view"
            >
              <Map className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <ListingFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>

          {/* Listings area */}
          <div className="flex-1 min-w-0">
            {isFetching && !isLoading && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Updating results…
              </div>
            )}

            {viewMode === 'map' ? (
              <ListingMap listings={listings} />
            ) : (
              <ListingGrid listings={listings} isLoading={isLoading} />
            )}

            {pagination && pagination.total_pages > 1 && (
              <Pagination
                page={filters.page ?? 1}
                totalPages={pagination.total_pages}
                onPageChange={(p) => handleFilterChange({ page: p })}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
