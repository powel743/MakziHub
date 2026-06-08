import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Upload, X } from 'lucide-react'
import { createListing, updateListing, uploadPhoto, deletePhoto, getListing } from '../../api/listings.api'
import { APPROVED_ESTATES, HOUSE_TYPES, AMENITIES } from '../../utils/constants'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'
import type { ListingPhoto } from '../../utils/constants'

const schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  estate: z.string().min(1, 'Select an estate'),
  house_type: z.string().min(1, 'Select a house type'),
  rent_ksh: z.coerce.number().int('Rent must be a whole number of KES').min(1000, 'Minimum rent is KES 1,000'),
  deposit_ksh: z.coerce.number().int('Deposit must be a whole number of KES').optional(),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(1),
  description: z.string().min(30, 'Description must be at least 30 characters'),
  available_from: z.string().min(1, 'Select availability date'),
  amenities: z.array(z.string()),
  furnished: z.boolean(),
  address: z.string().min(5, 'Enter the address'),
})

type FormData = z.infer<typeof schema>

const STEPS = ['Basic Info', 'Details', 'Photos', 'Review']

export default function AddEditListing() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [step, setStep] = useState(0)
  const [photos, setPhotos] = useState<ListingPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [listingId, setListingId] = useState<string | null>(id || null)

  const { register, control, handleSubmit, reset, watch, getValues, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amenities: [], furnished: false, bedrooms: 1, bathrooms: 1 },
  })

  const MIN_PHOTOS = 3

  useEffect(() => {
    if (isEdit && id) {
      getListing(id).then((l) => {
        reset({
          title: l.title,
          estate: l.estate,
          house_type: l.house_type,
          rent_ksh: l.rent_ksh,
          deposit_ksh: l.deposit_ksh,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          description: l.description,
          available_from: l.available_from.split('T')[0],
          amenities: l.amenities ?? [],
          furnished: l.furnished ?? false,
          address: l.address || '',
        })
        setPhotos(l.photos ?? [])
      })
    }
  }, [id, isEdit, reset])

  const handleStep1 = () => setStep(1)
  const handleStep3 = () => setStep(3)

  // Moving from Details → Photos. Photos require a listing id, so for a new
  // listing we create the record now and reuse it on final publish.
  const handleStep2 = async () => {
    if (!isEdit && !listingId) {
      const valid = await trigger()
      if (!valid) {
        toast.error('Please complete all required fields before adding photos')
        return
      }
      try {
        const created = await createListing(getValues())
        setListingId((created as any).listing_id ?? (created as any).id ?? null)
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Could not save listing')
        return
      }
    }
    setStep(2)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (listingId) {
        await updateListing(listingId, data)
        toast.success(isEdit ? 'Listing updated!' : 'Listing published!')
      } else {
        const created = await createListing(data)
        setListingId((created as any).listing_id ?? (created as any).id ?? null)
        toast.success('Listing created!')
      }
      navigate('/lister/listings')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save listing')
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!listingId) {
      toast.error('Save basic info first before uploading photos')
      return
    }
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 10) {
      toast.error('Maximum 10 photos allowed')
      return
    }
    setUploading(true)
    for (const file of files) {
      try {
        const res = await uploadPhoto(listingId, file)
        setPhotos((prev) => [...prev, res.photo || res])
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!listingId) return
    try {
      await deletePhoto(listingId, photoId)
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    } catch {
      toast.error('Could not delete photo')
    }
  }

  const amenitiesVal = watch('amenities') || []

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit Listing' : 'Add New Listing'} — MakaziHub</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display text-gray-900 mb-6">
          {isEdit ? 'Edit Listing' : 'Add New Listing'}
        </h1>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>
              <Input label="Listing Title" placeholder="e.g. Spacious 2 Bed Apartment in Westlands" error={errors.title?.message} {...register('title')} />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Estate <span className="text-red-400">*</span></label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" {...register('estate')}>
                  <option value="">Select estate...</option>
                  {APPROVED_ESTATES.sort().map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                {errors.estate && <p className="mt-1 text-xs text-red-500">{errors.estate.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">House Type <span className="text-red-400">*</span></label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" {...register('house_type')}>
                  <option value="">Select type...</option>
                  {HOUSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {errors.house_type && <p className="mt-1 text-xs text-red-500">{errors.house_type.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Monthly Rent (KES)" type="number" placeholder="25000" error={errors.rent_ksh?.message} {...register('rent_ksh')} />
                <Input label="Deposit (KES, optional)" type="number" placeholder="50000" error={errors.deposit_ksh?.message} {...register('deposit_ksh')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Bedrooms</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" {...register('bedrooms')}>
                    {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? 'Studio' : n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Bathrooms</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" {...register('bathrooms')}>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={handleStep1} fullWidth>Next: Details →</Button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Property Details</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description <span className="text-red-400">*</span></label>
                <textarea rows={5} placeholder="Describe the property in detail..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" {...register('description')} />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
              </div>
              <Input label="Address (shown only after unlock)" placeholder="e.g. Off Waiyaki Way, near Total petrol station" error={errors.address?.message} {...register('address')} />
              <Input label="Available From" type="date" error={errors.available_from?.message} {...register('available_from')} />
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" {...register('furnished')} />
                  <span className="text-sm font-medium text-gray-700">Property is furnished</span>
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Amenities</label>
                <Controller
                  control={control}
                  name="amenities"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {AMENITIES.map((a) => (
                        <label key={a.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-primary"
                            checked={field.value.includes(a.value)}
                            onChange={(e) => {
                              if (e.target.checked) field.onChange([...field.value, a.value])
                              else field.onChange(field.value.filter((v: string) => v !== a.value))
                            }}
                          />
                          <span className="text-sm text-gray-700">{a.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(0)} variant="outline" fullWidth>← Back</Button>
                <Button onClick={handleStep2} fullWidth>Next: Photos →</Button>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Photos ({photos.length}/10)</h2>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-primary transition-colors">
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">Click to upload photos</p>
                <label className="cursor-pointer">
                  <span className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    {uploading ? 'Uploading…' : 'Choose Files'}
                  </span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading || photos.length >= 10} />
                </label>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG up to 5MB each. Max 10 photos.</p>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, i) => (
                    <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded font-medium">Cover</div>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < MIN_PHOTOS && (
                <p className="text-xs text-amber-600">
                  Add at least {MIN_PHOTOS} photos to publish your listing ({photos.length}/{MIN_PHOTOS}).
                </p>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" fullWidth>← Back</Button>
                <Button onClick={handleStep3} fullWidth>Next: Review →</Button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 3 && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Review & Submit</h2>
              <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                {[
                  ['Title', watch('title')],
                  ['Estate', watch('estate')],
                  ['Type', watch('house_type')],
                  ['Rent', `KES ${(watch('rent_ksh') || 0).toLocaleString()}/mo`],
                  ['Bedrooms', String(watch('bedrooms'))],
                  ['Photos', String(photos.length)],
                  ['Amenities', String((watch('amenities') || []).length) + ' selected'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
              {!isEdit && photos.length < MIN_PHOTOS && (
                <p className="text-xs text-amber-600 text-center">
                  Add at least {MIN_PHOTOS} photos (currently {photos.length}) before publishing.
                </p>
              )}
              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} type="button" variant="outline" fullWidth>← Back</Button>
                <Button type="submit" loading={isSubmitting} fullWidth disabled={!isEdit && photos.length < MIN_PHOTOS}>
                  {isEdit ? 'Save Changes' : 'Publish Listing'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
