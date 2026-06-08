import { APPROVED_ESTATES, HOUSE_TYPES } from '../../utils/constants'
import type { ListingFilters } from '../../utils/constants'
import { Button } from '../ui/Button'
import { SlidersHorizontal, X } from 'lucide-react'

interface ListingFiltersProps {
  filters: ListingFilters
  onChange: (f: Partial<ListingFilters>) => void
  onReset: () => void
}

export function ListingFiltersPanel({ filters, onChange, onReset }: ListingFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          Filters
        </h3>
        <button onClick={onReset} className="text-xs text-gray-400 hover:text-primary flex items-center gap-1">
          <X className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Estate */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Estate</label>
        <select
          value={filters.estate || ''}
          onChange={(e) => onChange({ estate: e.target.value || undefined })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
        >
          <option value="">All Estates</option>
          {APPROVED_ESTATES.sort().map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Price Range (KES)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_rent || ''}
            onChange={(e) => onChange({ min_rent: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.max_rent || ''}
            onChange={(e) => onChange({ max_rent: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Bedrooms</label>
        <div className="flex gap-2 flex-wrap">
          {['Any', '1', '2', '3', '4+'].map((b) => (
            <button
              key={b}
              onClick={() => onChange({ bedrooms: b === 'Any' ? undefined : b === '4+' ? 4 : Number(b) })}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                (b === 'Any' && !filters.bedrooms) || (b !== 'Any' && filters.bedrooms === (b === '4+' ? 4 : Number(b)))
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* House type */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Type</label>
        <select
          value={filters.house_type || ''}
          onChange={(e) => onChange({ house_type: e.target.value || undefined })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
        >
          <option value="">All Types</option>
          {HOUSE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Verified listings only</span>
          <input
            type="checkbox"
            checked={!!filters.verified_only}
            onChange={(e) => onChange({ verified_only: e.target.checked || undefined })}
            className="w-4 h-4 accent-primary"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Available now</span>
          <input
            type="checkbox"
            checked={!!filters.available_now}
            onChange={(e) => onChange({ available_now: e.target.checked || undefined })}
            className="w-4 h-4 accent-primary"
          />
        </label>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Sort by</label>
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => onChange({ sort: e.target.value as ListingFilters['sort'] })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="featured">Featured</option>
        </select>
      </div>
    </div>
  )
}
