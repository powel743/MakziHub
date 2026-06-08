import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, MessageSquare, Eye, Plus, BarChart2, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { formatRelative, formatKES } from '../../utils/format'
import { PageSpinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'

export default function ListerDashboard() {
  const { user } = useAuth()
  const plan = user?.lister_profile?.plan || 'free'

  const { data: stats, isLoading } = useQuery({
    queryKey: ['lister-stats'],
    queryFn: async () => {
      const res = await client.get('/lister/stats')
      return res.data
    },
  })

  const { data: recentInquiries = [] } = useQuery({
    queryKey: ['lister-inquiries-recent'],
    queryFn: async () => {
      const res = await client.get('/inquiries/received?limit=5')
      return res.data.inquiries || res.data.data || []
    },
  })

  const { data: topListings = [] } = useQuery({
    queryKey: ['lister-top-listings'],
    queryFn: async () => {
      const res = await client.get('/listings/mine?limit=5&sort=unlocks')
      return res.data.data || []
    },
  })

  if (isLoading) return <PageSpinner />

  return (
    <>
      <Helmet><title>Lister Dashboard — MakaziHub</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={plan === 'business' ? 'purple' : plan === 'pro' ? 'blue' : 'gray'}>
                {plan.toUpperCase()} Plan
              </Badge>
              {plan === 'free' && (
                <Link to="/lister/billing" className="text-xs text-primary hover:underline">Upgrade →</Link>
              )}
            </div>
          </div>
          <Link
            to="/lister/listings/new"
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Listing
          </Link>
        </div>

        {/* Verification alert */}
        {user?.lister_profile?.verified_tier === 'none' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Get verified to build trust</p>
              <p className="text-xs text-amber-600 mt-0.5">Verified listings get 3× more views.</p>
              <Link to="/lister/verification" className="text-xs text-amber-700 underline mt-1 inline-block">Start verification →</Link>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Home className="w-5 h-5" />, label: 'Active Listings', value: stats?.active_listings ?? 0, color: 'text-primary bg-primary/10' },
            { icon: <MessageSquare className="w-5 h-5" />, label: 'Inquiries This Month', value: stats?.inquiries_month ?? 0, color: 'text-blue-600 bg-blue-50' },
            { icon: <Eye className="w-5 h-5" />, label: 'Profile Views (7d)', value: stats?.profile_views_7d ?? 0, color: 'text-purple-600 bg-purple-50' },
            { icon: <BarChart2 className="w-5 h-5" />, label: 'Unlocks This Month', value: stats?.unlocks_month ?? 0, color: 'text-amber-600 bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { to: '/lister/listings/new', icon: <Plus className="w-4 h-4" />, label: 'Add Listing' },
            { to: '/lister/inquiries', icon: <MessageSquare className="w-4 h-4" />, label: 'View Inquiries' },
            { to: '/lister/analytics', icon: <BarChart2 className="w-4 h-4" />, label: 'Analytics', locked: plan === 'free' },
            { to: '/lister/billing', icon: <ShieldCheck className="w-4 h-4" />, label: 'Upgrade Plan' },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-all ${a.locked ? 'opacity-50' : ''}`}
            >
              {a.icon}
              <span className="text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent inquiries */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Inquiries</h2>
            <Link to="/lister/inquiries" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No inquiries yet. Add more listings to attract tenants.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentInquiries.map((inq: any) => (
                <div key={inq.id || inq.listing_id} className="px-6 py-3 flex items-center gap-3 text-sm">
                  <div className="flex-1 truncate">
                    <span className="font-medium text-gray-900">{inq.listing_title}</span>
                  </div>
                  <span className="text-gray-400">{formatRelative(inq.unlocked_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listing performance */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Listing Performance</h2>
            <Link to="/lister/listings" className="text-sm text-primary hover:underline">All listings →</Link>
          </div>
          {topListings.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No listings yet. <Link to="/lister/listings/new" className="text-primary hover:underline">Add your first listing →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                    <th className="px-6 py-3">Listing</th>
                    <th className="px-6 py-3">Rent</th>
                    <th className="px-6 py-3">Views</th>
                    <th className="px-6 py-3">Unlocks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topListings.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link to={`/listings/${l.id}`} className="font-medium text-gray-900 hover:text-primary truncate block max-w-[200px]">{l.title}</Link>
                        <span className="text-xs text-gray-400">{l.estate}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{formatKES(l.rent)}</td>
                      <td className="px-6 py-3 text-gray-700">{l.view_count ?? 0}</td>
                      <td className="px-6 py-3 text-gray-700">{l.unlock_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
