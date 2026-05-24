import { Helmet } from 'react-helmet-async'
import { Phone, CreditCard, ShieldCheck, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import client from '../../api/client'
import toast from 'react-hot-toast'
import { useState } from 'react'

const TIERS = [
  {
    key: 'phone',
    icon: <Phone className="w-6 h-6" />,
    title: 'Phone Verified',
    desc: 'Your phone number is confirmed. This tier is applied automatically.',
    color: 'text-gray-600 bg-gray-100',
    action: null,
  },
  {
    key: 'id',
    icon: <CreditCard className="w-6 h-6" />,
    title: 'ID Verified',
    desc: 'Submit your National ID or Business Registration for identity verification. Reviewed within 24 hours.',
    color: 'text-blue-600 bg-blue-50',
    action: 'Submit ID Documents',
  },
  {
    key: 'visited',
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Inspector Visited',
    desc: 'A MakaziHub inspector visits the property to confirm it exists. Green badge in search results.',
    color: 'text-green-600 bg-green-50',
    action: 'Request Inspector Visit',
  },
]

export default function Verification() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const currentTier = user?.lister_profile?.verified_tier || 'none'

  const tierOrder = ['none', 'phone', 'id', 'visited']
  const currentIndex = tierOrder.indexOf(currentTier)

  const requestVerification = async (tier: string) => {
    setLoading(tier)
    try {
      await client.post('/lister/verification/request', { tier })
      toast.success('Verification request submitted! Our team will contact you.')
    } catch {
      toast.error('Could not submit request. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Helmet><title>Verification — MakaziHub Lister</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display text-gray-900 mb-2">Lister Verification</h1>
        <p className="text-gray-500 text-sm mb-8">
          Verified listers get more views and higher trust from tenants. Work your way through the tiers.
        </p>

        <div className="space-y-4">
          {TIERS.map((tier, i) => {
            const tierIdx = i + 1 // phone=1, id=2, visited=3
            const achieved = currentIndex >= tierIdx
            const isNext = currentIndex === tierIdx - 1

            return (
              <div
                key={tier.key}
                className={`bg-white rounded-2xl border p-6 transition-all ${
                  achieved ? 'border-green-200 bg-green-50/30' : isNext ? 'border-primary' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${tier.color}`}>
                    {tier.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{tier.title}</h3>
                      {achieved && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Achieved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{tier.desc}</p>
                    {tier.action && isNext && !achieved && (
                      <Button
                        onClick={() => requestVerification(tier.key)}
                        loading={loading === tier.key}
                        size="sm"
                        className="mt-4"
                      >
                        {tier.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          <strong>Tip:</strong> Listings with the "Inspector Visited" badge get 3× more contact unlocks on average.
        </div>
      </div>
    </>
  )
}
