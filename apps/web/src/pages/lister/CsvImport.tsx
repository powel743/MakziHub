import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Upload, Lock, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { previewImport, confirmImport } from '../../api/agencies.api'
import { Button } from '../../components/ui/Button'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function CsvImport() {
  const { user } = useAuth()
  const plan = user?.lister_profile?.plan || 'free'
  const [preview, setPreview] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (plan !== 'business') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">CSV Bulk Import is a Business feature</h2>
        <p className="text-gray-500 mb-6">Import hundreds of listings at once with our CSV tool. Upgrade to Business to access it.</p>
        <Link to="/lister/billing" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
          Upgrade to Business — KES 8,000/mo
        </Link>
      </div>
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const agencyId = (user as any)?.lister_profile?.agency_id || 'my'
      const res = await previewImport(agencyId, file)
      setPreview(res.rows || res.preview || [])
      setSessionId(res.import_session_id || res.session_id)
    } catch {
      toast.error('Failed to parse CSV. Check the file format.')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async () => {
    if (!sessionId) return
    setConfirming(true)
    try {
      const agencyId = (user as any)?.lister_profile?.agency_id || 'my'
      await confirmImport(agencyId, sessionId)
      toast.success('Import queued! Your listings will appear shortly.')
      setPreview(null)
      setSessionId(null)
    } catch {
      toast.error('Import failed. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  const validRows = (preview || []).filter((r: any) => r.valid !== false)

  return (
    <>
      <Helmet><title>CSV Import — MakaziHub</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display text-gray-900 mb-2">Bulk CSV Import</h1>
        <p className="text-gray-500 text-sm mb-6">Upload a CSV file to import multiple listings at once.</p>

        {!preview && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center hover:border-primary transition-colors">
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="font-semibold text-gray-900 mb-2">Upload your CSV file</h2>
            <p className="text-sm text-gray-500 mb-4">Required columns: estate, house_type, rent, bedrooms, available_from, address</p>
            <label className="cursor-pointer">
              <span className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                {uploading ? 'Parsing…' : 'Choose CSV File'}
              </span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        )}

        {preview && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Preview ({preview.length} rows)</h2>
                <p className="text-sm text-gray-500">{validRows.length} valid, {preview.length - validRows.length} with errors</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setPreview(null)} variant="outline" size="sm">Upload different file</Button>
                <Button onClick={handleConfirm} loading={confirming} disabled={validRows.length === 0} size="sm">
                  Confirm Import ({validRows.length} rows)
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-2 text-left">Row</th>
                    <th className="px-4 py-2 text-left">Estate</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Rent</th>
                    <th className="px-4 py-2 text-left">Beds</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.map((row: any, i: number) => (
                    <tr key={i} className={row.valid === false ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2">{row.estate}</td>
                      <td className="px-4 py-2">{row.house_type}</td>
                      <td className="px-4 py-2">{row.rent ? `KES ${row.rent.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-2">{row.bedrooms ?? '—'}</td>
                      <td className="px-4 py-2">
                        {row.valid === false
                          ? <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3" /> Invalid</span>
                          : <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Valid</span>}
                      </td>
                      <td className="px-4 py-2 text-red-400">{row.error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
