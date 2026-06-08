import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, Zap, Smartphone } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { updateListing, deleteListing } from '../../api/listings.api'
import { boostListing } from '../../api/payments.api'
import { formatKES, formatDate } from '../../utils/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageSpinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import type { Listing } from '../../utils/constants'

const BOOST_OPTIONS: { plan: '7day' | '14day' | '30day'; label: string; price: number }[] = [
  { plan: '7day', label: '7 days', price: 500 },
  { plan: '14day', label: '14 days', price: 900 },
  { plan: '30day', label: '30 days', price: 1500 },
]

export default function MyListings() {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [boostFor, setBoostFor] = useState<Listing | null>(null)
  const [boostSent, setBoostSent] = useState(false)

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ['my-listings'],
    queryFn: async () => {
      const res = await client.get('/listings/mine')
      return res.data.data || []
    },
  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateListing(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  })

  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      toast.success('Listing deleted')
      setDeletingId(null)
    },
    onError: () => toast.error('Could not delete listing'),
  })

  const { mutate: boost, isPending: boosting } = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: '7day' | '14day' | '30day' }) => boostListing(id, plan),
    onSuccess: () => setBoostSent(true),
    onError: () => toast.error('Could not start boost payment'),
  })

  const closeBoost = () => {
    setBoostFor(null)
    setBoostSent(false)
    queryClient.invalidateQueries({ queryKey: ['my-listings'] })
  }

  if (isLoading) return <PageSpinner />

  return (
    <>
      <Helmet><title>My Listings — MakaziHub</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-gray-900">My Listings ({listings.length})</h1>
          <Link to="/lister/listings/new">
            <Button size="sm"><Plus className="w-4 h-4" /> Add Listing</Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <h2 className="font-semibold text-gray-900 mb-2">No listings yet</h2>
            <p className="text-gray-500 text-sm mb-6">Post your first vacant unit and start getting inquiries.</p>
            <Link to="/lister/listings/new"><Button size="sm"><Plus className="w-4 h-4" /> Add Your First Listing</Button></Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3">Listing</th>
                    <th className="px-5 py-3">Rent</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Available</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {l.photos?.[0] ? (
                              <img src={l.photos[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[180px]">{l.title}</p>
                            <p className="text-xs text-gray-400">{l.estate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">{formatKES(l.rent)}/mo</td>
                      <td className="px-5 py-4">
                        <Badge variant={l.status === 'available' ? 'green' : l.status === 'suspended' ? 'red' : 'gray'}>
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{formatDate(l.available_from)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link to={`/listings/${l.id}`} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/lister/listings/${l.id}/edit`} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => toggleStatus({ id: l.id, status: l.status === 'available' ? 'taken' : 'available' })}
                            className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title={l.status === 'available' ? 'Mark as taken' : 'Mark as available'}
                          >
                            {l.status === 'available' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { setBoostFor(l); setBoostSent(false) }}
                            className={`p-1.5 rounded-lg transition-colors ${l.is_featured ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                            title={l.is_featured ? 'Featured — boost again' : 'Boost listing'}
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(l.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Boost listing */}
        {boostFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={closeBoost} />
            <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              {!boostSent ? (
                <>
                  <h3 className="font-bold text-gray-900 mb-1">Boost this listing</h3>
                  <p className="text-sm text-gray-500 mb-5 truncate">
                    Feature “{boostFor.title}” at the top of search results.
                  </p>
                  <div className="space-y-2">
                    {BOOST_OPTIONS.map((o) => (
                      <button
                        key={o.plan}
                        onClick={() => boost({ id: boostFor.id, plan: o.plan })}
                        disabled={boosting}
                        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 text-sm hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                      >
                        <span className="font-medium text-gray-900">Featured for {o.label}</span>
                        <span className="font-bold text-primary">{formatKES(o.price)}</span>
                      </button>
                    ))}
                  </div>
                  <Button onClick={closeBoost} variant="ghost" fullWidth className="mt-4">Cancel</Button>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Check your phone</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    An M-Pesa prompt has been sent. Enter your PIN to pay — your listing is featured once the payment is confirmed.
                  </p>
                  <Button onClick={closeBoost} fullWidth>Done</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDeletingId(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
              <h3 className="font-bold text-gray-900 mb-2">Delete listing?</h3>
              <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button onClick={() => setDeletingId(null)} variant="ghost" fullWidth>Cancel</Button>
                <Button onClick={() => remove(deletingId)} loading={removing} variant="danger" fullWidth>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
