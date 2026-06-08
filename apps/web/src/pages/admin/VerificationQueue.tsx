import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ExternalLink } from 'lucide-react'
import {
  getAdminVerifications,
  approveVerification,
  rejectVerification,
  type AdminVerification,
} from '../../api/verification.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'
import toast from 'react-hot-toast'

const TABS = ['pending', 'approved', 'rejected'] as const
type Tab = (typeof TABS)[number]

export default function VerificationQueue() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('pending')
  const [rejecting, setRejecting] = useState<AdminVerification | null>(null)
  const [reason, setReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', tab],
    queryFn: () => getAdminVerifications(tab),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-verifications'] })

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: (id: string) => approveVerification(id),
    onSuccess: () => { toast.success('Approved'); invalidate() },
    onError: () => toast.error('Could not approve'),
  })

  const { mutate: reject, isPending: rejectingPending } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectVerification(id, reason),
    onSuccess: () => {
      toast.success('Rejected')
      setRejecting(null)
      setReason('')
      invalidate()
    },
    onError: () => toast.error('Could not reject'),
  })

  const rows = data?.verifications ?? []

  return (
    <>
      <Helmet><title>Verifications — MakaziHub Admin</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-gray-900">ID Verifications</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No {tab} verifications.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3">Lister</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Documents</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{v.name || '—'}</p>
                      <p className="text-xs text-gray-400">{v.email}</p>
                      <p className="text-xs text-gray-400">{v.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 capitalize">{v.id_type.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(v.submitted_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <a href={v.front_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> Front
                        </a>
                        {v.back_url && (
                          <a href={v.back_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="w-3 h-3" /> Back
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {v.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approve(v.id)} loading={approving}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => { setRejecting(v); setReason('') }}>Reject</Button>
                        </div>
                      ) : v.status === 'rejected' ? (
                        <span className="text-xs text-red-500">{v.rejection_reason || 'Rejected'}</span>
                      ) : (
                        <span className="text-xs text-green-600">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!rejecting} onClose={() => setRejecting(null)} title="Reject verification">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Tell the lister why so they can resubmit.</p>
          <Input
            label="Reason"
            placeholder="e.g. Photo is blurry / details don't match"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setRejecting(null)}>Cancel</Button>
            <Button
              variant="danger"
              fullWidth
              disabled={!reason.trim()}
              loading={rejectingPending}
              onClick={() => rejecting && reject({ id: rejecting.id, reason })}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
