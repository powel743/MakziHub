import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, Building2, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import client from '../../api/client'
import toast from 'react-hot-toast'
import logoSrc from '../../assets/logo.svg'

type ListerRole = 'landlord' | 'caretaker' | 'agency'

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [showListerOptions, setShowListerOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const selectRole = async (role: 'tenant' | ListerRole) => {
    setIsLoading(true)
    try {
      const res = await client.patch('/auth/me', { role })
      const updated = { ...user!, ...res.data.user, role }
      setUser(updated)
      toast.success('Account set up successfully!')
      navigate(role === 'tenant' ? '/tenant/dashboard' : '/lister/dashboard', { replace: true })
    } catch {
      const updated = { ...user!, role }
      setUser(updated)
      navigate(role === 'tenant' ? '/tenant/dashboard' : '/lister/dashboard', { replace: true })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Choose your role — MakaziHub</title></Helmet>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-lg text-center">
          <img src={logoSrc} alt="MakaziHub" className="h-10 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-bold font-display text-gray-900 mb-2">How will you use MakaziHub?</h1>
          <p className="text-gray-500 mb-10 text-sm">You can always change this later in settings.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Tenant */}
            <button
              onClick={() => selectRole('tenant')}
              disabled={isLoading}
              className="group bg-white border-2 border-gray-200 hover:border-primary rounded-xl p-8 text-left transition-all hover:shadow-sm"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                <Home className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">I'm looking for a house</h2>
              <p className="text-sm text-gray-500">Browse listings, unlock contacts, and find your next home.</p>
              <div className="mt-5 text-sm font-semibold text-primary group-hover:underline">
                Continue as Tenant →
              </div>
            </button>

            {/* Lister */}
            <div className="relative">
              <button
                onClick={() => setShowListerOptions(!showListerOptions)}
                disabled={isLoading}
                className="group w-full bg-white border-2 border-gray-200 hover:border-primary rounded-xl p-8 text-left transition-all hover:shadow-sm"
              >
                <div className="w-14 h-14 rounded-xl bg-green-50 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Building2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">I'm listing a property</h2>
                <p className="text-sm text-gray-500">Post vacant units and get enquiries from qualified tenants.</p>
                <div className="mt-5 text-sm font-semibold text-primary flex items-center gap-1 group-hover:underline">
                  Choose lister type <ChevronDown className={`w-4 h-4 transition-transform ${showListerOptions ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showListerOptions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-sm z-10 overflow-hidden">
                  <button
                    onClick={() => selectRole('landlord')}
                    disabled={isLoading}
                    className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <div className="font-semibold text-gray-900 text-sm">Landlord</div>
                    <div className="text-xs text-gray-500 mt-0.5">I own 1–3 rental units</div>
                  </button>
                  <button
                    onClick={() => selectRole('caretaker')}
                    disabled={isLoading}
                    className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <div className="font-semibold text-gray-900 text-sm">Caretaker</div>
                    <div className="text-xs text-gray-500 mt-0.5">I manage multiple units for owners</div>
                  </button>
                  <button
                    onClick={() => selectRole('agency')}
                    disabled={isLoading}
                    className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 text-sm">Agency</div>
                    <div className="text-xs text-gray-500 mt-0.5">I manage 50+ units across buildings</div>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
