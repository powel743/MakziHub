import { useParams, Link } from 'react-router-dom'
import { useSeoMeta } from '../../hooks/useSeoMeta'
import { buildAgencyMeta } from '../../utils/seo'
import { useQuery } from '@tanstack/react-query'
import { Building2, CheckCircle, Calendar } from 'lucide-react'
import { getAgency } from '../../api/agencies.api'
import { ListingGrid } from '../../components/listings/ListingGrid'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'

export default function AgencyProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: agency, isLoading } = useQuery({
    queryKey: ['agency', id],
    queryFn: () => getAgency(id!),
    enabled: !!id,
  })

  if (isLoading) return <PageSpinner />
  if (!agency) return <div className="text-center py-20 text-gray-400">Agency not found</div>

  return (
    <>
      {useSeoMeta({ ...buildAgencyMeta(agency.name), canonicalPath: `/agencies/${agency.id}` })}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <div className="flex items-start gap-6 flex-wrap">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt={agency.name} className="w-20 h-20 rounded-2xl object-cover border border-gray-100" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                {agency.name[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold font-display text-gray-900">{agency.name}</h1>
                {agency.verified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified Agency
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-2 max-w-xl">{agency.description}</p>
              <div className="flex items-center gap-5 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> {agency.listing_count ?? agency.listings?.length ?? 0} active listings
                </span>
                {(agency.member_since || agency.created_at) && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Member since {formatDate(agency.member_since || agency.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-6">Listings by {agency.name}</h2>
        <ListingGrid listings={agency.listings || []} isLoading={false} />
      </div>
    </>
  )
}
