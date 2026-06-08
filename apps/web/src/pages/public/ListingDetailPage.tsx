import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Bed, Bath, CalendarDays, Eye, Heart, Flag, Star, ChevronLeft, CheckCircle } from 'lucide-react'
import { useListing } from '../../hooks/useListing'
import { useAuth } from '../../hooks/useAuth'
import { PhotoGallery } from '../../components/listings/PhotoGallery'
import { AmenitiesList } from '../../components/listings/AmenitiesList'
import { VerifiedBadge } from '../../components/listings/VerifiedBadge'
import { LockedContactZone } from '../../components/listings/LockedContactZone'
import { Badge } from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { buildListingMeta } from '../../utils/seo'
import { useSeoMeta } from '../../hooks/useSeoMeta'
import { ListingJsonLd } from '../../components/seo/ListingJsonLd'
import { BreadcrumbJsonLd } from '../../components/seo/BreadcrumbJsonLd'
import { MoreInEstate } from '../../components/listings/MoreInEstate'
import { formatKES, formatDate, formatHouseType, formatRelative } from '../../utils/format'
import { reportListing, getListingReviews, submitReview } from '../../api/listings.api'
import toast from 'react-hot-toast'
import { useQuery, useMutation } from '@tanstack/react-query'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { listing, isLoading, error } = useListing(id!)
  const { isAuthenticated, user } = useAuth()
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getListingReviews(id!),
    enabled: !!id,
  })

  const { mutate: submitReviewMutation, isPending: submittingReview } = useMutation({
    mutationFn: () => submitReview(id!, { rating, body: reviewBody }),
    onSuccess: () => {
      toast.success('Review submitted!')
      setReviewBody('')
      setRating(5)
      refetchReviews()
    },
    onError: () => toast.error('Could not submit review'),
  })

  const handleReport = async () => {
    if (!reportReason) return
    try {
      await reportListing(id!, reportReason)
      toast.success('Report submitted. Thank you.')
      setShowReport(false)
    } catch {
      toast.error('Could not submit report')
    }
  }

  if (isLoading) return <PageSpinner />
  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h2>
        <p className="text-gray-500 mb-6">This listing may have been removed or taken.</p>
        <Link to="/listings" className="text-primary hover:underline">Browse other listings</Link>
      </div>
    )
  }

  const meta = buildListingMeta(listing)

  return (
    <>
      {useSeoMeta({
        title: meta.title,
        description: meta.description,
        canonicalPath: `/listings/${listing.id}`,
        image: meta.ogImage,
      })}
      <ListingJsonLd listing={listing} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Listings', path: '/listings' },
          { name: listing.estate, path: `/estates/${listing.estate}` },
          { name: listing.title, path: `/listings/${listing.id}` },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/listings" className="flex items-center gap-1 hover:text-primary">
            <ChevronLeft className="w-4 h-4" /> Listings
          </Link>
          <span>/</span>
          <Link to={`/estates/${listing.estate}`} className="hover:text-primary">{listing.estate}</Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-8">
            <PhotoGallery photos={listing.photos} title={listing.title} estate={listing.estate} />

            {/* Title & key info */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <VerifiedBadge tier={listing.verified_tier} size="md" />
                    {listing.status === 'taken' && <Badge variant="red">Taken</Badge>}
                    {listing.furnished && <Badge variant="blue">Furnished</Badge>}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold font-display text-gray-900">{listing.title}</h1>
                  <div className="flex items-center gap-1 text-gray-500 mt-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{listing.estate}, Nairobi</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{formatKES(listing.rent)}</div>
                  <div className="text-sm text-gray-500">per month</div>
                  {listing.deposit && (
                    <div className="text-sm text-gray-400 mt-1">Deposit: {formatKES(listing.deposit)}</div>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-5 mt-5 py-5 border-y border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                  <Bed className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} Bed`}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Bath className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{listing.bathrooms} Bath</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-gray-400 text-sm">Type:</span>
                  <span className="font-medium text-sm">{formatHouseType(listing.house_type)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CalendarDays className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">From {formatDate(listing.available_from)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 ml-auto">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{listing.view_count} views</span>
                  <Heart className="w-4 h-4 ml-2" />
                  <span className="text-sm">{listing.saved_count} saved</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About this property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
              <AmenitiesList amenities={listing.amenities} showAll />
            </div>

            {/* Lister info */}
            {listing.lister && (
            <div className="bg-gray-50 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Listed by</h2>
              <div className="flex items-center gap-3">
                {listing.lister.agency?.logo_url ? (
                  <img src={listing.lister.agency.logo_url} alt={listing.lister.agency.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {listing.lister.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                    {listing.lister.agency ? listing.lister.agency.name : listing.lister.name}
                    {listing.lister.id_verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </p>
                  {listing.lister.agency && (
                    <Link to={`/agencies/${listing.lister.agency.id}`} className="text-sm text-primary hover:underline">
                      View agency profile →
                    </Link>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
              </h2>

              {reviews.length === 0 && (
                <p className="text-sm text-gray-400 italic mb-4">No reviews yet. Be the first!</p>
              )}

              <div className="space-y-4 mb-6">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex text-amber-400">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'fill-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{r.tenant_name_masked}</span>
                      <span className="text-xs text-gray-400 ml-auto">{formatRelative(r.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{r.body}</p>
                  </div>
                ))}
              </div>

              {isAuthenticated && user?.role === 'tenant' && (
                <div className="border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-medium text-gray-900 mb-3">Leave a review</h3>
                  <div className="flex gap-2 mb-3">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => setRating(s)}>
                        <Star className={`w-6 h-6 cursor-pointer ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    rows={3}
                    placeholder="Share your experience with this listing..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <Button
                    onClick={() => submitReviewMutation()}
                    loading={submittingReview}
                    disabled={!reviewBody.trim()}
                    className="mt-3"
                    size="sm"
                  >
                    Submit Review
                  </Button>
                </div>
              )}
            </div>

            {/* Report button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                <Flag className="w-4 h-4" />
                Report this listing
              </button>
            </div>
          </div>

          {/* Right col — sticky contact */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <LockedContactZone listing={listing} />
            </div>
          </div>
        </div>

        {/* Internal linking — more listings in the same estate */}
        <MoreInEstate estate={listing.estate} excludeId={listing.id} />
      </div>

      {/* Report modal */}
      <Modal isOpen={showReport} onClose={() => setShowReport(false)} title="Report this listing">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Help us keep MakaziHub safe. Select a reason for reporting:</p>
          <div className="space-y-2">
            {['Fake or scam listing', 'Wrong location or estate', 'Already taken but still listed', 'Inappropriate content', 'Other'].map((reason) => (
              <label key={reason} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <input
                  type="radio"
                  name="reason"
                  value={reason}
                  checked={reportReason === reason}
                  onChange={() => setReportReason(reason)}
                  className="accent-primary"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowReport(false)} variant="ghost" fullWidth>Cancel</Button>
            <Button onClick={handleReport} disabled={!reportReason} fullWidth variant="danger">
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
