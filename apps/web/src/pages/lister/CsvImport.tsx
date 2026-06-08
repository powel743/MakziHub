import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Upload, Lock, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { previewImport, confirmImport } from '../../api/agencies.api'
import { Button } from '../../components/ui/Button'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface PreviewResult {
  total: number
  valid_count: number
  error_count: number
  errors: Array<{ row: number; message: string }>
  valid_rows: Array<Record<string, any>>
}

export default function CsvImport() {
  const { user } = useAuth()
  const plan = user?.lister_profile?.plan || 'free'
  const agencyId = user?.lister_profile?.agency_id || null
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (plan !== 'business') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
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
    if (!agencyId) {
      toast.error('No agency found on your account.')
      return
    }
    setUploading(true)
    try {
      const res = await previewImport(agencyId, file)
      setPreview({
        total: res.total ?? 0,
        valid_count: res.valid_count ?? (res.valid_rows?.length ?? 0),
        error_count: res.error_count ?? (res.errors?.length ?? 0),
        errors: res.errors ?? [],
        valid_rows: res.valid_rows ?? [],
      })
    } catch {
      toast.error('Failed to parse CSV. Check the file format.')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview || !agencyId || preview.valid_rows.length === 0) return
    setConfirming(true)
    try {
      await confirmImport(agencyId, preview.valid_rows)
      toast.success('Import queued! Your listings will appear shortly.')
      setPreview(null)
    } catch {
      toast.error('Import failed. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <>
      <Helmet><title>CSV Import — MakaziHub</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900 mb-2">Bulk CSV Import</h1>
        <p className="text-gray-500 text-sm mb-6">Upload a CSV file to import multiple listings at once.</p>

        {!preview && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center hover:border-primary transition-colors">
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="font-semibold text-gray-900 mb-2">Upload your CSV file</h2>
            <p className="text-sm text-gray-500 mb-4">Required columns: title, estate, address, rent_ksh, house_type, bedrooms, bathrooms, available_from</p>
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
                <h2 className="font-semibold text-gray-900">Preview ({preview.total} rows)</h2>
                <p className="text-sm text-gray-500">
                  <span className="text-green-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {preview.valid_count} valid</span>
                  {preview.error_count > 0 && (
                    <span className="text-red-500 inline-flex items-center gap-1 ml-3"><XCircle className="w-3 h-3" /> {preview.error_count} with errors</span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setPreview(null)} variant="outline" size="sm">Upload different file</Button>
                <Button onClick={handleConfirm} loading={confirming} disabled={preview.valid_rows.length === 0} size="sm">
                  Confirm Import ({preview.valid_count} rows)
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Estate</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Rent</th>
                    <th className="px-4 py-2 text-left">Beds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.valid_rows.map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2">{row.title}</td>
                      <td className="px-4 py-2">{row.estate}</td>
                      <td className="px-4 py-2">{row.house_type}</td>
                      <td className="px-4 py-2">{row.rent_ksh ? `KES ${Number(row.rent_ksh).toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-2">{row.bedrooms ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.errors.length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-700 mb-2">Rows with errors (skipped)</p>
                <ul className="space-y-1 text-xs text-red-600">
                  {preview.errors.map((err, i) => (
                    <li key={i}><span className="font-medium">Row {err.row}:</span> {err.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
