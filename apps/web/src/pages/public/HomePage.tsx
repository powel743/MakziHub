import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useSeoMeta } from '../../hooks/useSeoMeta'
import { Search, Shield, Zap, Building2, Star, ArrowRight, CheckCircle } from 'lucide-react'
import { useListings } from '../../hooks/useListings'
import { ListingCard } from '../../components/listings/ListingCard'
import { LocalBusinessJsonLd } from '../../components/seo/LocalBusinessJsonLd'
import { APPROVED_ESTATES, PLANS } from '../../utils/constants'
import { buildHomeMeta } from '../../utils/seo'
import { formatKES } from '../../utils/format'

const TOP_ESTATES = [
  'Kasarani', 'Westlands', 'Kilimani', 'Ruaka', 'Embakasi',
  'South B', 'Langata', 'Roysambu', 'Donholm', 'Karen',
  'Githurai', 'Umoja', 'Buruburu', 'Parklands', 'Lavington',
]

export default function HomePage() {
  const navigate = useNavigate()
  const [estate, setEstate] = useState('')
  const [maxRent, setMaxRent] = useState('')

  const { listings: featured, isLoading } = useListings({ sort: 'featured', limit: 6, page: 1 })

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (estate) params.set('estate', estate)
    if (maxRent) params.set('max_rent', maxRent)
    navigate(`/listings?${params.toString()}`)
  }

  return (
    <>
      {useSeoMeta({ ...buildHomeMeta(), canonicalPath: '/' })}
      <Helmet>
        {/* Kenya local-SEO signals (Nairobi County) */}
        <meta name="geo.region" content="KE-30" />
        <meta name="geo.placename" content="Nairobi, Kenya" />
        <meta name="geo.position" content="-1.286389;36.817223" />
        <meta name="ICBM" content="-1.286389, 36.817223" />
      </Helmet>
      <LocalBusinessJsonLd />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Kenya's most trusted rental platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
              Find your next home<br />
              <span className="text-green-400">in Nairobi</span>
            </h1>

            <p className="text-lg text-gray-300 mb-10 max-w-xl">
              Verified listings. Real photos. Direct caretaker contacts. No agent middlemen.
            </p>

            {/* Search bar */}
            <div className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-2xl max-w-2xl">
              <select
                value={estate}
                onChange={(e) => setEstate(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-900 text-sm bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select estate...</option>
                {APPROVED_ESTATES.sort().map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <input
                type="number"
                placeholder="Max rent (KES)"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="w-full sm:w-40 px-4 py-3 text-gray-900 text-sm bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            <div className="flex items-center gap-6 mt-6 text-sm text-gray-400">
              <span>🏠 1,200+ listings</span>
              <span>✓ 300+ verified listers</span>
              <span>📍 30 estates</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display text-gray-900 mb-3">How MakaziHub Works</h2>
            <p className="text-gray-500">Simple steps to find your next home — or fill your vacant unit</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Tenants */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">T</span>
                <h3 className="font-semibold text-gray-900">For Tenants</h3>
              </div>
              <div className="space-y-5">
                {[
                  { icon: <Search className="w-5 h-5" />, title: 'Search', desc: 'Browse verified listings by estate, price, and size' },
                  { icon: <Shield className="w-5 h-5" />, title: 'Unlock', desc: 'Pay KES 100 via M-Pesa to reveal contact details' },
                  { icon: <Zap className="w-5 h-5" />, title: 'Contact', desc: 'Call or WhatsApp the caretaker directly — no middleman' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{step.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Listers */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">L</span>
                <h3 className="font-semibold text-gray-900">For Listers</h3>
              </div>
              <div className="space-y-5">
                {[
                  { icon: <Building2 className="w-5 h-5" />, title: 'List for Free', desc: 'Add photos, amenities, and rent details in minutes' },
                  { icon: <Star className="w-5 h-5" />, title: 'Get Inquiries', desc: 'Tenants unlock your contact — you get SMS notifications' },
                  { icon: <CheckCircle className="w-5 h-5" />, title: 'Fill Units Faster', desc: 'Reach thousands of house-hunting Nairobians' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-accent flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{step.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {!isLoading && featured.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-display text-gray-900">Featured Listings</h2>
              <Link to="/listings" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Estate */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold font-display text-gray-900 mb-8">Browse by Estate</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {TOP_ESTATES.map((e) => (
              <Link
                key={e}
                to={`/estates/${encodeURIComponent(e)}`}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary hover:shadow-sm transition-all text-center"
              >
                {e}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display text-gray-900 mb-3">Simple Pricing for Listers</h2>
            <p className="text-gray-500">Start free. Upgrade when your units fill faster.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { key: 'free', label: 'Free', price: 0, features: ['3 active listings', 'Phone verified badge', 'Basic inbox'] },
              { key: 'caretaker_pro', label: 'Pro', price: PLANS.caretaker_pro.price, features: ['Unlimited listings', 'Analytics dashboard', 'Priority in search', 'Featured badge'], popular: true },
              { key: 'business', label: 'Business', price: PLANS.business.price, features: ['Everything in Pro', 'CSV bulk import', 'Team seats', 'Agency profile page', 'Advanced analytics'] },
            ].map((plan) => (
              <div
                key={plan.key}
                className={`rounded-2xl border p-6 ${plan.popular ? 'border-primary shadow-lg ring-1 ring-primary/20 relative' : 'border-gray-100 bg-white'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold text-gray-900 text-lg">{plan.label}</h3>
                <div className="my-3">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-gray-900">Free</span>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">{formatKES(plan.price)}<span className="text-sm font-normal text-gray-500">/mo</span></span>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth/signup"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-green-700'
                      : 'border border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-primary py-14">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold font-display mb-4">Are you a caretaker or agency?</h2>
          <p className="text-green-100 mb-8">List your vacant units free and reach thousands of Nairobi house hunters.</p>
          <Link
            to="/auth/signup"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            List for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
