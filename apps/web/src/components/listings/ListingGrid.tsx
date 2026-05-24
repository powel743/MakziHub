import { ListingCard } from './ListingCard'
import { PageSpinner } from '../ui/Spinner'
import type { Listing } from '../../utils/constants'
import { Home } from 'lucide-react'

interface ListingGridProps {
  listings: Listing[]
  isLoading: boolean
}

export function ListingGrid({ listings, isLoading }: ListingGridProps) {
  if (isLoading) return <PageSpinner />

  if (!listings.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Home className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Try adjusting your filters or searching in a different estate.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
