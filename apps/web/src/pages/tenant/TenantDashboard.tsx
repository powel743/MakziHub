import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, Heart, Bell, CreditCard, Phone, MapPin, Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useInquiries } from '../../hooks/useInquiries'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, deleteAlert } from '../../api/alerts.api'
import { formatKES, formatRelative } from '../../utils/format'
import { PageSpinner } from '../../components/ui/Spinner'
import { CreditBalance } from '../../components/payments/CreditBalance'
import toast from 'react-hot-toast'

export default function TenantDashboard() {
  const { user } = useAuth()
  const { inquiries, isLoading: loadingInquiries } = useInquiries()
  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  })

  const { mutate: removeAlert } = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert deleted')
    },
  })

  if (loadingInquiries) return <PageSpinner />

  const recent = inquiries.slice(0, 5)

  return (
    <>
      <Helmet><title>My Dashboard — MakaziHub Tenant</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1 text-sm">Your rental search dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-gray-500">Active Alerts</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-gray-500">Unlocked Contacts</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{inquiries.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-500">Free Credits</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{user?.tenant_profile?.free_credits ?? 0}</p>
          </div>
        </div>

        <CreditBalance />

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 mb-8">
          <Link to="/listings" className="flex items-center gap-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl p-4 font-medium text-sm transition-colors">
            <Search className="w-5 h-5" /> Browse Listings
          </Link>
          <Link to="/tenant/alerts" className="flex items-center gap-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl p-4 font-medium text-sm transition-colors">
            <Bell className="w-5 h-5" /> Manage Alerts
          </Link>
          <Link to="/tenant/billing" className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl p-4 font-medium text-sm transition-colors">
            <CreditCard className="w-5 h-5" /> Buy Credits
          </Link>
        </div>

        {/* Recent unlocks */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Unlocked Contacts</h2>
            <Link to="/tenant/inquiries" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No unlocked contacts yet. <Link to="/listings" className="text-primary hover:underline">Browse listings →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((inq) => (
                <div key={inq.inquiry_id} className="px-6 py-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{inq.listing?.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3" /> {inq.listing?.estate}
                      {inq.contact_details && <span>· {inq.contact_details.phone}</span>}
                    </div>
                  </div>
                  {inq.unlocked_at && <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(inq.unlocked_at)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search alerts */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Your Search Alerts</h2>
            <Link to="/tenant/alerts" className="text-sm text-primary hover:underline">Manage →</Link>
          </div>
          {loadingAlerts ? <div className="px-6 py-6"><PageSpinner /></div> : alerts.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No alerts. <Link to="/tenant/alerts" className="text-primary hover:underline">Create one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="px-6 py-3 flex items-center gap-3">
                  <Bell className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 text-sm text-gray-700">
                    {alert.estate} · Max {formatKES(alert.max_rent ?? 0)}
                    {alert.bedrooms ? ` · ${alert.bedrooms} bed` : ''}
                  </div>
                  <button onClick={() => removeAlert(alert.id)} className="text-gray-300 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
