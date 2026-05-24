import { useState, useEffect } from 'react'
import { Smartphone, RefreshCw, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { useQueryClient } from '@tanstack/react-query'
import { getListing } from '../../api/listings.api'

interface MpesaPromptProps {
  checkoutRequestId: string
  listingId: string
  onSuccess: () => void
  onClose: () => void
}

export function MpesaPrompt({ listingId, onSuccess, onClose }: MpesaPromptProps) {
  const [seconds, setSeconds] = useState(120)
  const [checking, setChecking] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds])

  const handleManualCheck = async () => {
    setChecking(true)
    try {
      const listing = await getListing(listingId)
      if (listing.contact_details) {
        queryClient.setQueryData(['listing', listingId], listing)
        onSuccess()
      }
    } catch {
      // ignore
    } finally {
      setChecking(false)
    }
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const timedOut = seconds <= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-primary" />
        </div>

        {timedOut ? (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Payment timed out</h3>
            <p className="text-sm text-gray-500 mb-6">
              The M-Pesa prompt expired. Please try again.
            </p>
            <Button onClick={onClose} fullWidth variant="outline">Close</Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Check your phone</h3>
            <p className="text-sm text-gray-500 mb-2">
              An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the payment.
            </p>

            <div className="flex items-center justify-center gap-3 my-5">
              <Spinner size="md" />
              <span className="text-2xl font-mono font-bold text-gray-700">
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-5">Waiting for payment confirmation…</p>

            <div className="space-y-3">
              <Button
                onClick={handleManualCheck}
                loading={checking}
                fullWidth
                variant="primary"
              >
                <RefreshCw className="w-4 h-4" />
                I've paid — show contact
              </Button>
              <Button onClick={onClose} fullWidth variant="ghost" size="sm">
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
