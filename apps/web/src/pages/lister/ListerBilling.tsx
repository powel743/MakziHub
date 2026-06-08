import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CheckCircle, CreditCard } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { subscribe } from '../../api/payments.api'
import { Button } from '../../components/ui/Button'
import { PLANS } from '../../utils/constants'
import { formatKES, formatDate } from '../../utils/format'
import toast from 'react-hot-toast'

const LISTER_PLANS = [
  {
    key: 'free',
    label: 'Free',
    price: 0,
    features: ['3 active listings', 'Phone verified badge', 'Basic inquiries inbox', 'CSV export of inquiries'],
  },
  {
    key: 'caretaker_pro',
    label: 'Pro',
    price: PLANS.caretaker_pro.price,
    features: ['Unlimited listings', 'Analytics dashboard', 'Priority placement', 'Featured badge in search', 'SMS inquiry alerts'],
    popular: true,
  },
  {
    key: 'business',
    label: 'Business / Agency',
    price: PLANS.business.price,
    features: ['Everything in Pro', 'Agency profile page', 'CSV bulk import', 'Team member seats (5)', 'Inspector visit verification', 'Dedicated support'],
  },
]

export default function ListerBilling() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const currentPlan = user?.lister_profile?.plan || 'free'
  const planExpiry = user?.lister_profile?.plan_expires_at

  const handleUpgrade = async (planKey: string) => {
    if (!user?.phone) return
    setLoading(planKey)
    try {
      await subscribe(planKey, user.phone)
      toast.success('M-Pesa prompt sent! Your plan will upgrade once payment is confirmed.')
    } catch {
      toast.error('Payment initiation failed. Try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Helmet><title>Billing & Plans — MakaziHub Lister</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900 mb-2">Billing & Plans</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your subscription and upgrade to unlock more features.</p>

        {/* Current plan banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="font-bold text-gray-900 text-lg capitalize">{currentPlan} Plan</p>
            {planExpiry && currentPlan !== 'free' && (
              <p className="text-xs text-gray-500 mt-0.5">Renews {formatDate(planExpiry)}</p>
            )}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {LISTER_PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key
            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-xl border p-6 transition-all ${
                  plan.popular ? 'border-primary shadow-sm ring-1 ring-primary/20' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Current
                  </span>
                )}

                <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.label}</h3>
                <div className="mb-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-gray-900">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-900">{formatKES(plan.price)}</span>
                      <span className="text-sm text-gray-500">/month</span>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium">
                    Active Plan
                  </div>
                ) : plan.price === 0 ? null : (
                  <Button
                    onClick={() => handleUpgrade(plan.key)}
                    loading={loading === plan.key}
                    fullWidth
                    variant={plan.popular ? 'primary' : 'outline'}
                  >
                    Upgrade via M-Pesa
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          All payments are via M-Pesa. Subscriptions renew monthly. Cancel anytime.
        </p>
      </div>
    </>
  )
}
