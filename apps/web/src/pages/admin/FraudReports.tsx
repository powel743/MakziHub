import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFraudReports, resolveFraudReport } from '../../api/admin.api'
import { Flag, CheckCircle, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatRelative } from '../../utils/format'
import toast from 'react-hot-toast'

export default function FraudReports() {
  const [resolved, setResolved] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['fraud-reports', resolved],
    queryFn: () => getFraudReports(resolved),
  })

  const { mutate: resolve } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'keep' | 'suspend' }) =>
      resolveFraudReport(id, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-reports'] })
      toast.success('Report resolved')
    },
    onError: () => toast.error('Action failed'),
  })

  const reports = data?.reports || data?.data || []

  return (
    <>
      <Helmet><title>Fraud Reports — MakaziHub Admin</title></Helmet>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900">Fraud Reports</h1>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setResolved(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!resolved ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Open
            </button>
            <button
              onClick={() => setResolved(true)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${resolved ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Resolved
            </button>
          </div>
        </div>

        {isLoading ? <PageSpinner /> : reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Flag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No {resolved ? 'resolved' : 'open'} reports</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r: any) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                      <Flag className="w-5 h-5" />
                    </div>
                    <div>
                      <Link to={`/listings/${r.listing_id}`} target="_blank" className="font-semibold text-gray-900 hover:text-primary">
                        {r.listing_title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">Reason: <span className="font-medium text-gray-700">{r.reason}</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelative(r.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.resolved ? (
                      <Badge variant="green">Resolved</Badge>
                    ) : (
                      <>
                        <button
                          onClick={() => resolve({ id: r.id, action: 'keep' })}
                          className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                          title="Keep listing (dismiss report)"
                        >
                          <CheckCircle className="w-4 h-4" /> Keep Listing
                        </button>
                        <button
                          onClick={() => resolve({ id: r.id, action: 'suspend' })}
                          className="flex items-center gap-1.5 text-sm text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                          title="Suspend listing"
                        >
                          <XCircle className="w-4 h-4" /> Suspend
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
