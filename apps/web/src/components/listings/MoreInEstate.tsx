import { Link } from 'react-router-dom'
import { useListings } from '../../hooks/useListings'
import { ListingCard } from './ListingCard'

/**
 * "More listings in {estate}" — internal-linking block for the listing detail page.
 * Renders up to 3 other available listings in the same estate.
 */
export function MoreInEstate({ estate, excludeId }: { estate: string; excludeId: string }) {
  const { listings } = useListings({ estate, limit: 4 })
  const others = listings.filter((l) => l.id !== excludeId).slice(0, 3)

  if (others.length === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">More listings in {estate}</h2>
        <Link to={`/estates/${encodeURIComponent(estate)}`} className="text-sm text-primary hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {others.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  )
}
