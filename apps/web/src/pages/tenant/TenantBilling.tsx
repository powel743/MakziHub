import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Zap, CreditCard } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { buyCredits, subscribe } from '../../api/payments.api'
import { Button } from '../../components/ui/Button'
import { CREDIT_BUNDLES, PLANS } from '../../utils/constants'
import { formatKES } from '../../utils/format'
import toast from 'react-hot-toast'

export default function TenantBilling() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handleBuyCredits = async (bundle: '3credits' | '10credits') => {
    if (!user?.phone) return
    setLoading(bundle)
    try {
      await buyCredits(bundle, user.phone)
      toast.success('M-Pesa prompt sent! Check your phone.')
    } catch {
      toast.error('Payment initiation failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleSubscribe = async () => {
    if (!user?.phone) return
    setLoading('subscribe')
    try {
      await subscribe('tenant_unlimited', user.phone)
      toast.success('M-Pesa prompt sent! Unlimited access will activate shortly.')
    } catch {
      toast.error('Subscription failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Helmet><title>Billing — MakaziHub Tenant</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900 mb-6">Credits & Billing</h1>

        {/* Current balance */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Free Credits Remaining</p>
            <p className="text-3xl font-bold text-gray-900">{user?.tenant_profile?.free_credits ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Each credit unlocks one listing's contact details</p>
          </div>
        </div>

        {/* Credit bundles */}
        <h2 className="font-semibold text-gray-900 mb-4">Buy Credits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {(Object.entries(CREDIT_BUNDLES) as [string, { price: number; credits: number }][]).map(([key, bundle]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-gray-900">{bundle.credits} Credits</span>
                <span className="text-xl font-bold text-primary">{formatKES(bundle.price)}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {formatKES(Math.round(bundle.price / bundle.credits))} per contact unlock
              </p>
              <Button
                onClick={() => handleBuyCredits(key as '3credits' | '10credits')}
                loading={loading === key}
                fullWidth
                variant={key === '10credits' ? 'primary' : 'outline'}
              >
                Buy via M-Pesa
              </Button>
            </div>
          ))}
        </div>

        {/* Unlimited plan */}
        <h2 className="font-semibold text-gray-900 mb-4">Unlimited Access</h2>
        <div className="bg-white rounded-xl border-2 border-primary p-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tenant Unlimited</h3>
              <p className="text-sm text-gray-500">Unlimited contact unlocks for 1 month</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{formatKES(PLANS.tenant_unlimited.price)}</span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
          </div>
          {user?.tenant_profile?.is_subscribed ? (
            <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Active subscription — unlimited unlocks enabled
            </div>
          ) : (
            <Button onClick={handleSubscribe} loading={loading === 'subscribe'} fullWidth size="lg">
              Subscribe via M-Pesa
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
