import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyInquiries, unlockContact } from '../api/inquiries.api'

export function useInquiries() {
  const query = useQuery({
    queryKey: ['inquiries'],
    queryFn: getMyInquiries,
  })
  return {
    inquiries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function useUnlockContact(listingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ phone }: { phone: string }) => unlockContact(listingId, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}
