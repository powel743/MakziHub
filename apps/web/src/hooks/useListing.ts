import { useQuery } from '@tanstack/react-query'
import { getListing } from '../api/listings.api'

export function useListing(id: string) {
  const query = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
    enabled: !!id,
  })

  return {
    listing: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
