import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, Building2 } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import client from '../../api/client'
import toast from 'react-hot-toast'
import logoSrc from '../../assets/logo.svg'

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()

  const selectRole = async (role: 'tenant' | 'lister') => {
    try {
      const res = await client.patch('/auth/me', { role })
      const updated = { ...user!, ...res.data.user, role }
      setUser(updated)
      toast.success(`Account set up as ${role}!`)
      navigate(role === 'tenant' ? '/tenant/dashboard' : '/lister/dashboard', { replace: true })
    } catch {
      // If endpoint doesn't exist, just navigate
      const updated = { ...user!, role }
      setUser(updated)
      navigate(role === 'tenant' ? '/tenant/dashboard' : '/lister/dashboard', { replace: true })
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
              className="group bg-white border-2 border-gray-100 hover:border-primary rounded-2xl p-8 text-left transition-all hover:shadow-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                <Home className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">I'm looking for a house</h2>
              <p className="text-sm text-gray-500">Browse listings, unlock contacts, and find your next home.</p>
              <div className="mt-5 text-sm font-semibold text-primary group-hover:underline">
                Continue as Tenant →
              </div>
            </button>

            {/* Lister */}
            <button
              onClick={() => selectRole('lister')}
              className="group bg-white border-2 border-gray-100 hover:border-accent rounded-2xl p-8 text-left transition-all hover:shadow-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-accent flex items-center justify-center mb-5 group-hover:bg-accent group-hover:text-white transition-colors">
                <Building2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">I'm listing a property</h2>
              <p className="text-sm text-gray-500">Post vacant units and get enquiries from qualified tenants.</p>
              <div className="mt-5 text-sm font-semibold text-accent group-hover:underline">
                Continue as Lister →
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
