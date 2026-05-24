import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { getRevenue } from '../../api/admin.api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatKES } from '../../utils/format'
import { format, subMonths } from 'date-fns'

export default function RevenueReports() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue', month],
    queryFn: () => getRevenue(month),
  })

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') }
  })

  const breakdown = data?.breakdown || {
    contact_unlocks: 0,
    credit_bundles: 0,
    subscriptions: 0,
    featured_boosts: 0,
  }

  const total = Object.values(breakdown).reduce((a: number, b) => a + (b as number), 0)

  const chartData = [
    { name: 'Contact Unlocks', amount: breakdown.contact_unlocks },
    { name: 'Credit Bundles', amount: breakdown.credit_bundles },
    { name: 'Subscriptions', amount: breakdown.subscriptions },
    { name: 'Featured Boosts', amount: breakdown.featured_boosts },
  ]

  return (
    <>
      <Helmet><title>Revenue Reports — MakaziHub Admin</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-bold font-display text-gray-900">Revenue Reports</h1>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? <PageSpinner /> : (
          <>
            {/* Total */}
            <div className="bg-gradient-to-r from-primary to-green-700 text-white rounded-2xl p-6 mb-6">
              <p className="text-green-100 text-sm mb-1">Total Revenue — {months.find(m => m.value === month)?.label}</p>
              <p className="text-4xl font-bold">{formatKES(total)}</p>
            </div>

            {/* Breakdown cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {chartData.map((d) => (
                <div key={d.name} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">{d.name}</p>
                  <p className="text-xl font-bold text-gray-900">{formatKES(d.amount)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {total > 0 ? `${Math.round((d.amount / total) * 100)}%` : '0%'} of total
                  </p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Revenue by Stream</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(val: number) => formatKES(val)} />
                  <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </>
  )
}
