import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Bed, Bath, MapPin, CalendarDays } from 'lucide-react'
import { formatKES, formatDate, formatHouseType } from '../../utils/format'
import { VerifiedBadge } from './VerifiedBadge'
import { saveListing } from '../../api/listings.api'
import { useAuth } from '../../hooks/useAuth'
import type { Listing } from '../../utils/constants'
import clsx from 'clsx'

interface ListingCardProps {
  listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
  const { isAuthenticated } = useAuth()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return
    setSaving(true)
    try {
      const res = await saveListing(listing.id)
      setSaved(res.saved)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const coverPhoto = listing.photos?.[0]?.url

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-5xl">🏠</span>
          </div>
        )}

        {/* Status badge */}
        {listing.status === 'taken' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">TAKEN</span>
          </div>
        )}

        {/* Save button */}
        {isAuthenticated && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
          >
            <Heart className={clsx('w-4 h-4', saved ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
          </button>
        )}

        {/* Verified badge overlay */}
        {listing.verified_tier !== 'none' && (
          <div className="absolute bottom-3 left-3">
            <VerifiedBadge tier={listing.verified_tier} />
          </div>
        )}

        {/* Featured label */}
        {listing.status === 'available' && listing.saved_count > 10 && (
          <div className="absolute top-3 left-3">
            <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">HOT</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <span className="flex-shrink-0 text-base font-bold text-primary">
            {formatKES(listing.rent)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs">{listing.estate}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {listing.bathrooms} bath
          </span>
          <span className="text-gray-300">•</span>
          <span>{formatHouseType(listing.house_type)}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <CalendarDays className="w-3.5 h-3.5" />
            From {formatDate(listing.available_from)}
          </span>
          <span className="text-xs text-gray-400">{listing.saved_count} saved</span>
        </div>
      </div>
    </Link>
  )
}
