import { useState, useEffect, useRef } from 'react'
import type { PaymentStatus } from '../utils/constants'
import { getMyInquiries } from '../api/inquiries.api'

const POLL_INTERVAL = 3000 // 3 seconds
const MAX_POLL_TIME = 120000 // 2 minutes

interface UsePaymentReturn {
  status: PaymentStatus
  checkoutRequestId: string | null
  startPolling: (checkoutRequestId: string, listingId: string) => void
  reset: () => void
}

export function usePayment(onSuccess?: () => void): UsePaymentReturn {
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null)
  const listingIdRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  const startPolling = (reqId: string, listingId: string) => {
    setStatus('pending')
    setCheckoutRequestId(reqId)
    listingIdRef.current = listingId

    intervalRef.current = setInterval(async () => {
      try {
        const inquiries = await getMyInquiries()
        const found = inquiries.find((i) => i.listing?.id === listingIdRef.current)
        if (found) {
          stopPolling()
          setStatus('complete')
          onSuccess?.()
        }
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL)

    timeoutRef.current = setTimeout(() => {
      stopPolling()
      setStatus('timeout')
    }, MAX_POLL_TIME)
  }

  const reset = () => {
    stopPolling()
    setStatus('idle')
    setCheckoutRequestId(null)
    listingIdRef.current = null
  }

  useEffect(() => () => stopPolling(), [])

  return { status, checkoutRequestId, startPolling, reset }
}
