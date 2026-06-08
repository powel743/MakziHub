import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Phone, MapPin, MessageCircle } from 'lucide-react'
import { useInquiries } from '../../hooks/useInquiries'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatKES, formatDate, whatsappUrl } from '../../utils/format'

export default function MyInquiries() {
  const { inquiries, isLoading } = useInquiries()

  if (isLoading) return <PageSpinner />

  return (
    <>
      <Helmet><title>My Inquiries — MakaziHub</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900 mb-6">Unlocked Contacts</h1>

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Phone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">No unlocked contacts yet</h2>
            <p className="text-gray-500 text-sm mb-6">Browse listings and unlock contact details with KES 100.</p>
            <Link to="/listings" className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <div key={inq.inquiry_id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <Link to={`/listings/${inq.listing?.id}`} className="font-semibold text-gray-900 hover:text-primary transition-colors">
                      {inq.listing?.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {inq.listing?.estate}
                    </div>
                  </div>
                  {inq.unlocked_at && <span className="text-xs text-gray-400">Unlocked {formatDate(inq.unlocked_at)}</span>}
                </div>

                {inq.contact_details && (
                  <div className="mt-4 bg-green-50 rounded-xl p-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Address</p>
                      <p className="text-sm font-medium text-gray-900">{inq.contact_details.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                      <p className="text-sm font-bold text-gray-900">{inq.contact_details.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`tel:${inq.contact_details.phone}`}
                        className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                      <a
                        href={whatsappUrl(inq.contact_details.phone, inq.listing?.title ?? '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
