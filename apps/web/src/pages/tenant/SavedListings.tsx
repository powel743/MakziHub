import { Helmet } from 'react-helmet-async'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { ListingGrid } from '../../components/listings/ListingGrid'
import type { Listing } from '../../utils/constants'

export default function SavedListings() {
  const { data: saved = [], isLoading } = useQuery<Listing[]>({
    queryKey: ['saved-listings'],
    queryFn: async () => {
      const res = await client.get('/listings/saved')
      return res.data.data || []
    },
  })

  return (
    <>
      <Helmet><title>Saved Listings — MakaziHub</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6 text-red-400" />
          <h1 className="text-2xl font-bold font-display text-gray-900">Saved Listings</h1>
          <span className="text-sm text-gray-400">({saved.length})</span>
        </div>

        {!isLoading && saved.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">No saved listings yet</h2>
            <p className="text-gray-500 text-sm mb-6">Tap the heart icon on any listing to save it here.</p>
            <Link to="/listings" className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700">
              Browse Listings
            </Link>
          </div>
        ) : (
          <ListingGrid listings={saved} isLoading={isLoading} />
        )}
      </div>
    </>
  )
}
