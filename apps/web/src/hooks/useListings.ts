import { useQuery } from '@tanstack/react-query'
import { getListings } from '../api/listings.api'
import type { ListingFilters } from '../utils/constants'

export function useListings(filters: ListingFilters) {
  const query = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => getListings(filters),
    placeholderData: (prev) => prev,
  })

  return {
    listings: query.data?.data ?? [],
    pagination: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}
