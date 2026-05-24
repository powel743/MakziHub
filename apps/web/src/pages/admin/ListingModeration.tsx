import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getListingsQueue, moderateListing } from '../../api/admin.api'
import { CheckCircle, XCircle, Eye, Flag } from 'lucide-react'
import { formatDate, formatKES } from '../../utils/format'
import { Badge } from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'available', label: 'Approved' },
]

export default function ListingModeration() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || 'pending'
  const queryClient = useQueryClient()
  const [actionId, setActionId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings', status],
    queryFn: () => getListingsQueue(status),
  })

  const { mutate: moderate, isPending: moderating } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      moderateListing(id, { status: action }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
      toast.success(`Listing ${action === 'available' ? 'approved' : 'suspended'}`)
      setActionId(null)
    },
    onError: () => toast.error('Action failed'),
  })

  const listings = data?.data || data?.listings || []

  return (
    <>
      <Helmet><title>Listing Moderation — MakaziHub Admin</title></Helmet>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display text-gray-900 mb-6">Listing Moderation</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ status: tab.key })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? <PageSpinner /> : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No {status} listings</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Lister</th>
                  <th className="px-5 py-3">Rent</th>
                  <th className="px-5 py-3">Reports</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {l.photos?.[0] ? (
                            <img src={l.photos[0].url} alt="" className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full flex items-center justify-center text-lg">🏠</div>}
                        </div>
                        <div>
                          <Link to={`/listings/${l.id}`} target="_blank" className="font-medium text-gray-900 hover:text-primary max-w-[180px] block truncate">
                            {l.title}
                          </Link>
                          <p className="text-xs text-gray-400">{l.estate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{l.lister?.name || '—'}</td>
                    <td className="px-5 py-4 font-medium">{formatKES(l.rent)}</td>
                    <td className="px-5 py-4">
                      {l.reports_count > 0 ? (
                        <Badge variant="red"><Flag className="w-3 h-3" /> {l.reports_count}</Badge>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{l.created_at ? formatDate(l.created_at) : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/listings/${l.id}`} target="_blank" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {status !== 'available' && (
                          <button
                            onClick={() => moderate({ id: l.id, action: 'available' })}
                            disabled={moderating && actionId === l.id}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {status !== 'suspended' && (
                          <button
                            onClick={() => { setActionId(l.id); moderate({ id: l.id, action: 'suspended' }) }}
                            disabled={moderating && actionId === l.id}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            title="Suspend"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
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
