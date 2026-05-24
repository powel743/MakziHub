import { AMENITIES } from '../../utils/constants'
import { CheckCircle2, XCircle } from 'lucide-react'

interface AmenitiesListProps {
  amenities: string[]
  showAll?: boolean
}

export function AmenitiesList({ amenities, showAll = false }: AmenitiesListProps) {
  const displayItems = showAll ? AMENITIES : AMENITIES.filter((a) => amenities.includes(a.value))

  if (!amenities.length && !showAll) {
    return <p className="text-sm text-gray-400 italic">No amenities listed</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {displayItems.map((amenity) => {
        const has = amenities.includes(amenity.value)
        return (
          <div
            key={amenity.value}
            className={`flex items-center gap-2 text-sm ${has ? 'text-gray-800' : 'text-gray-300'}`}
          >
            {has ? (
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
            ) : showAll ? (
              <XCircle className="w-4 h-4 text-gray-200 flex-shrink-0" />
            ) : null}
            {(has || showAll) && <span>{amenity.label}</span>}
          </div>
        )
      })}
    </div>
  )
}
