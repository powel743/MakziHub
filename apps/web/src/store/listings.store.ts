import { create } from 'zustand'
import type { ListingFilters } from '../utils/constants'

const defaultFilters: ListingFilters = {
  sort: 'newest',
  page: 1,
  limit: 20,
}

interface ListingsStore {
  filters: ListingFilters
  setFilters: (f: Partial<ListingFilters>) => void
  resetFilters: () => void
}

export const useListingsStore = create<ListingsStore>((set) => ({
  filters: defaultFilters,

  setFilters: (f) =>
    set((state) => ({
      filters: { ...state.filters, ...f, page: f.page ?? 1 },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}))
