import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Home, Users, Flag, BarChart2, CheckSquare, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAdminStats } from '../../api/admin.api'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatKES } from '../../utils/format'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  })

  if (isLoading) return <PageSpinner />

  const cards = [
    { label: 'New Listings Today', value: stats?.new_listings_today ?? 0, icon: <Home className="w-5 h-5" />, color: 'text-primary bg-primary/10', to: '/admin/listings' },
    { label: 'Pending Moderation', value: stats?.pending_moderation ?? 0, icon: <CheckSquare className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50', to: '/admin/listings?status=pending' },
    { label: 'Open Fraud Reports', value: stats?.open_fraud_reports ?? 0, icon: <Flag className="w-5 h-5" />, color: 'text-red-500 bg-red-50', to: '/admin/fraud' },
    { label: 'Revenue MTD', value: formatKES(stats?.revenue_mtd ?? 0), icon: <BarChart2 className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50', to: '/admin/revenue' },
  ]

  const links = [
    { to: '/admin/listings', icon: <CheckSquare className="w-5 h-5" />, label: 'Listing Moderation', desc: 'Review and approve pending listings' },
    { to: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'User Management', desc: 'Search, verify, or suspend users' },
    { to: '/admin/fraud', icon: <AlertTriangle className="w-5 h-5" />, label: 'Fraud Reports', desc: 'Review flagged listings' },
    { to: '/admin/revenue', icon: <BarChart2 className="w-5 h-5" />, label: 'Revenue Reports', desc: 'Monthly revenue breakdown' },
  ]

  return (
    <>
      <Helmet><title>Admin Dashboard — MakaziHub</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display text-gray-900 mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => (
            <Link key={c.label} to={c.to} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>{c.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{c.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-primary hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-primary/10 text-gray-500 group-hover:text-primary flex items-center justify-center flex-shrink-0 transition-colors">
                {l.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{l.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{l.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
