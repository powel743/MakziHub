import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, MapPin, MessageCircle, Lock, Unlock, LogIn, ExternalLink } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useUnlockContact } from '../../hooks/useInquiries'
import { usePayment } from '../../hooks/usePayment'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../ui/Button'
import { MpesaPrompt } from '../payments/MpesaPrompt'
import { formatKES, whatsappUrl } from '../../utils/format'
import type { Listing, ContactDetails } from '../../utils/constants'

interface LockedContactZoneProps {
  listing: Listing
}

export function LockedContactZone({ listing }: LockedContactZoneProps) {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(listing.contact_details ?? null)
  const [showMpesa, setShowMpesa] = useState(false)
  const [checkoutId, setCheckoutId] = useState<string | null>(null)

  const { mutate: unlock, isPending } = useUnlockContact(listing.id)

  const { startPolling } = usePayment(() => {
    // Refresh listing to get contact details
    queryClient.invalidateQueries({ queryKey: ['listing', listing.id] })
    setShowMpesa(false)
    // Re-fetch contact details
    queryClient.fetchQuery({ queryKey: ['listing', listing.id] }).then((data: any) => {
      if (data?.contact_details) setContactDetails(data.contact_details)
    })
  })

  const freeCredits = user?.tenant_profile?.free_credits ?? 0

  const handleUnlock = () => {
    if (!user) return
    unlock(
      { phone: user.phone },
      {
        onSuccess: (data) => {
          if (data.status === 'unlocked' || data.status === 'already_unlocked') {
            if (data.contact_details) setContactDetails(data.contact_details)
          } else if (data.status === 'pending' && data.checkout_request_id) {
            setCheckoutId(data.checkout_request_id)
            setShowMpesa(true)
            startPolling(data.checkout_request_id, listing.id)
          }
        },
      }
    )
  }

  // State 3: Already unlocked
  if (contactDetails) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-green-700 font-semibold">
          <Unlock className="w-5 h-5" />
          <span>Contact Details Unlocked</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-green-100">
            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Exact Address</p>
              <p className="text-sm font-medium text-gray-900">{contactDetails.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-green-100">
            <Phone className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Phone Number</p>
              <p className="text-sm font-medium text-gray-900">{contactDetails.phone}</p>
            </div>
            <a
              href={`tel:${contactDetails.phone}`}
              className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Call
            </a>
          </div>
        </div>

        <a
          href={whatsappUrl(contactDetails.phone, listing.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-[#128C7E] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Chat on WhatsApp
          <ExternalLink className="w-4 h-4 opacity-70" />
        </a>
      </div>
    )
  }

  // State 1: Not logged in
  if (!isAuthenticated) {
    return (
      <div className="relative rounded-2xl border border-gray-200 p-6 overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/60 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">Contact details are locked</p>
            <p className="text-gray-500 text-sm mt-1">Sign in to unlock for just KES 100</p>
          </div>
          <Link
            to="/auth/login"
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign in to Unlock
          </Link>
        </div>
        {/* Blurred placeholder */}
        <div className="space-y-3 opacity-30 select-none pointer-events-none">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-sm font-medium text-gray-900 blur-sm">Off Main Road, near junction</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-900 blur-sm">0712 345 678</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // State 2: Logged in, not yet unlocked
  return (
    <>
      <div className="border border-gray-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Lock className="w-5 h-5 text-gray-400" />
          <span>Contact Details</span>
        </div>

        {/* Blurred preview */}
        <div className="space-y-3 opacity-40 select-none pointer-events-none">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-sm font-medium text-gray-900 blur-sm">Off Main Road, near junction</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Phone Number</p>
              <p className="text-sm font-medium text-gray-900 blur-sm">0712 345 678</p>
            </div>
          </div>
        </div>

        {/* Unlock CTA */}
        {freeCredits > 0 ? (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              You have <strong>{freeCredits} free credit{freeCredits > 1 ? 's' : ''}</strong> remaining
            </div>
            <Button onClick={handleUnlock} loading={isPending} fullWidth size="lg" variant="primary">
              <Unlock className="w-4 h-4" />
              Use 1 Free Credit to Unlock
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>One-time unlock fee</span>
              <span className="font-bold text-gray-900 text-lg">{formatKES(100)}</span>
            </div>
            <Button onClick={handleUnlock} loading={isPending} fullWidth size="lg" variant="primary">
              <Unlock className="w-4 h-4" />
              Unlock Contact — KES 100
            </Button>
            <p className="text-xs text-center text-gray-400">Paid via M-Pesa. Refunded if listing is taken within 24hrs.</p>
          </div>
        )}
      </div>

      {showMpesa && checkoutId && (
        <MpesaPrompt
          checkoutRequestId={checkoutId}
          listingId={listing.id}
          onSuccess={() => {
            setShowMpesa(false)
            queryClient.invalidateQueries({ queryKey: ['listing', listing.id] })
          }}
          onClose={() => setShowMpesa(false)}
        />
      )}
    </>
  )
}
