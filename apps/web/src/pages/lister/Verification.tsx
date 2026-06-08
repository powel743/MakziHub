import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CreditCard, CheckCircle, Clock, XCircle, Upload } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { PageSpinner } from '../../components/ui/Spinner'
import { getVerificationStatus, uploadVerification } from '../../api/verification.api'
import { formatDate } from '../../utils/format'
import toast from 'react-hot-toast'

const ID_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_licence', label: 'Driving Licence' },
]

export default function Verification() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['verification-status'],
    queryFn: getVerificationStatus,
  })

  const [idType, setIdType] = useState('national_id')
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  const submit = async () => {
    if (!front) {
      toast.error('Please attach the front of your ID')
      return
    }
    setSubmitting(true)
    setProgress(0)
    try {
      const fd = new FormData()
      fd.append('id_type', idType)
      fd.append('id_front', front)
      if (back) fd.append('id_back', back)
      await uploadVerification(fd, setProgress)
      toast.success('Submitted! We will review within 24 hours.')
      // Optimistic: move to pending
      queryClient.setQueryData(['verification-status'], (old: any) => ({
        ...(old ?? {}),
        status: 'pending',
        latest: { ...(old?.latest ?? {}), status: 'pending', submitted_at: new Date().toISOString() },
      }))
      queryClient.invalidateQueries({ queryKey: ['verification-status'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <PageSpinner />

  const status = data?.status ?? 'unverified'

  const UploadForm = (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Submit your ID</h2>
          <p className="text-sm text-gray-500">Reviewed within 24 hours. JPG, PNG or PDF, max 5MB each.</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Document type</label>
        <select
          value={idType}
          onChange={(e) => setIdType(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Front <span className="text-red-400">*</span></label>
          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFront(e.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Back (optional)</label>
          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setBack(e.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-600" />
        </div>
      </div>

      {submitting && progress > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <Button onClick={submit} loading={submitting} disabled={!front} fullWidth>
        <Upload className="w-4 h-4" /> Submit for verification
      </Button>
    </div>
  )

  return (
    <>
      <Helmet><title>Verification — MakaziHub Lister</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display text-gray-900 mb-2">ID Verification</h1>
        <p className="text-gray-500 text-sm mb-8">
          Verified listers earn a badge and more tenant trust. Submit a government ID to get verified.
        </p>

        {status === 'verified' && (
          <div className="bg-white rounded-2xl border border-green-200 bg-green-50/40 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">✅ Verified</h2>
            <p className="text-sm text-gray-500">
              Your identity is verified. Your listings now show a verified badge.
              {data?.latest?.reviewed_at && ` Verified on ${formatDate(data.latest.reviewed_at)}.`}
            </p>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/40 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">Under review</h2>
            <p className="text-sm text-gray-500">
              We'll notify you by SMS within 24 hours.
              {data?.latest?.submitted_at && ` Submitted ${formatDate(data.latest.submitted_at)}.`}
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-red-200 bg-red-50/40 p-6">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-gray-900">Verification not approved</h2>
              </div>
              <p className="text-sm text-gray-600">{data?.latest?.rejection_reason || 'Your submission could not be verified.'}</p>
            </div>
            {UploadForm}
          </div>
        )}

        {status === 'unverified' && UploadForm}
      </div>
    </>
  )
}
