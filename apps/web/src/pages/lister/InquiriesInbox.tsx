// InquiriesInbox.tsx
import { Helmet } from 'react-helmet-async'
import { MessageSquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { formatRelative } from '../../utils/format'
import { PageSpinner } from '../../components/ui/Spinner'
import { Link } from 'react-router-dom'

export default function InquiriesInbox() {
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['lister-inquiries'],
    queryFn: async () => {
      const res = await client.get('/inquiries/received')
      return res.data.inquiries || res.data.data || []
    },
  })

  if (isLoading) return <PageSpinner />

  return (
    <>
      <Helmet><title>Inquiries Inbox — MakaziHub Lister</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900 mb-6">Inquiries Inbox</h1>
        {inquiries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">No inquiries yet</h2>
            <p className="text-gray-500 text-sm">When tenants unlock your listing, they'll appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3">Tenant</th>
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inquiries.map((inq: any) => (
                  <tr key={inq.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                        {(inq.tenant_name_masked || 'T')[0]}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900 max-w-[200px] truncate">{inq.listing_title}</td>
                    <td className="px-5 py-4 text-gray-500">{formatRelative(inq.unlocked_at)}</td>
                    <td className="px-5 py-4">
                      <Link to={`/listings/${inq.listing_id}`} className="text-xs text-primary hover:underline">View listing →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
