import { Helmet } from 'react-helmet-async'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { PageSpinner } from '../../components/ui/Spinner'
import { Lock } from 'lucide-react'

export default function Analytics() {
  const { user } = useAuth()
  const plan = user?.lister_profile?.plan || 'free'

  const { data, isLoading } = useQuery({
    queryKey: ['lister-analytics'],
    queryFn: async () => {
      const res = await client.get('/lister/analytics')
      return res.data
    },
    enabled: plan !== 'free',
  })

  if (plan === 'free') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Analytics is a Pro feature</h2>
        <p className="text-gray-500 mb-6">Upgrade to Pro or Business to unlock views, unlocks, and performance charts.</p>
        <Link to="/lister/billing" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
          Upgrade to Pro — KES 1,000/mo
        </Link>
      </div>
    )
  }

  if (isLoading) return <PageSpinner />

  const views = data?.views_daily || Array.from({ length: 30 }, (_, i) => ({ day: `Day ${i + 1}`, count: Math.floor(Math.random() * 50) }))
  const unlocks = data?.unlocks_daily || Array.from({ length: 30 }, (_, i) => ({ day: `Day ${i + 1}`, count: Math.floor(Math.random() * 10) }))
  const topListings = data?.top_listings || []

  return (
    <>
      <Helmet><title>Analytics — MakaziHub Lister</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display text-gray-900 mb-6">Analytics (Last 30 Days)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-5">Listing Views</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={views.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-5">Contact Unlocks</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={unlocks.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {topListings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Top Performing Listings</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Views</th>
                  <th className="px-5 py-3">Unlocks</th>
                  <th className="px-5 py-3">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topListings.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{l.title}</td>
                    <td className="px-5 py-3 text-gray-600">{l.views}</td>
                    <td className="px-5 py-3 text-gray-600">{l.unlocks}</td>
                    <td className="px-5 py-3 text-gray-600">{l.views ? `${Math.round((l.unlocks / l.views) * 100)}%` : '0%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
