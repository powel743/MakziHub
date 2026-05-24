import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Bell, Plus, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, createAlert, deleteAlert } from '../../api/alerts.api'
import { APPROVED_ESTATES, HOUSE_TYPES } from '../../utils/constants'
import { formatKES } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function SearchAlerts() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ estate: '', max_rent: '', bedrooms: '', house_type: '' })

  const { data: alerts = [], isLoading } = useQuery({ queryKey: ['alerts'], queryFn: getAlerts })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => createAlert({
      estate: form.estate,
      max_rent: Number(form.max_rent),
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      house_type: form.house_type || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setShowCreate(false)
      setForm({ estate: '', max_rent: '', bedrooms: '', house_type: '' })
      toast.success('Alert created! We\'ll notify you via SMS.')
    },
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert removed')
    },
  })

  if (isLoading) return <PageSpinner />

  return (
    <>
      <Helmet><title>Search Alerts — MakaziHub</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-900">Search Alerts</h1>
            <p className="text-sm text-gray-500 mt-0.5">Get SMS when a matching listing is posted</p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="w-4 h-4" /> New Alert
          </Button>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">No alerts yet</h2>
            <p className="text-gray-500 text-sm mb-6">Create an alert and we'll SMS you when matching listings appear.</p>
            <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="w-4 h-4" /> Create Alert</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-accent flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.estate || 'Any estate'}</p>
                  <p className="text-sm text-gray-500">
                    Max {formatKES(alert.max_rent)}
                    {alert.bedrooms ? ` · ${alert.bedrooms} bed` : ''}
                    {alert.house_type ? ` · ${alert.house_type.replace(/_/g, ' ')}` : ''}
                  </p>
                </div>
                <button onClick={() => remove(alert.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Search Alert">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Estate</label>
            <select value={form.estate} onChange={(e) => setForm({ ...form, estate: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Any estate</option>
              {APPROVED_ESTATES.sort().map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Max Rent (KES)</label>
            <input type="number" placeholder="e.g. 25000" value={form.max_rent}
              onChange={(e) => setForm({ ...form, max_rent: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Bedrooms (optional)</label>
            <select value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Any</option>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} bed</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">House Type (optional)</label>
            <select value={form.house_type} onChange={(e) => setForm({ ...form, house_type: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Any</option>
              {HOUSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowCreate(false)} variant="ghost" fullWidth>Cancel</Button>
            <Button onClick={() => create()} loading={creating} disabled={!form.max_rent} fullWidth>Create Alert</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
