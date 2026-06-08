import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Home } from 'lucide-react'
import { useSeoMeta } from '../hooks/useSeoMeta'

export default function NotFound() {
  const navigate = useNavigate()
  const [estate, setEstate] = useState('')

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(estate ? `/listings?estate=${encodeURIComponent(estate)}` : '/listings')
  }

  return (
    <>
      {useSeoMeta({
        title: 'Page Not Found | MakaziHub',
        description: 'This page doesn’t exist — but your next home might. Browse verified rentals across Nairobi on MakaziHub.',
        canonicalPath: '/404',
      })}
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <p className="text-6xl font-bold font-display text-gray-200 mb-3">404</p>
          <h1 className="text-2xl font-bold font-display text-gray-900 mb-2">
            This page doesn’t exist — but your next home might.
          </h1>
          <p className="text-gray-500 mb-6">Search for a rental by estate, or head back home.</p>

          <form onSubmit={search} className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={estate}
                onChange={(e) => setEstate(e.target.value)}
                placeholder="Try an estate, e.g. Kasarani"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button type="submit" className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
              Search
            </button>
          </form>

          <div className="flex items-center justify-center gap-4 text-sm">
            <Link to="/" className="flex items-center gap-1.5 text-primary font-medium hover:underline">
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link to="/listings" className="text-primary font-medium hover:underline">
              Browse all listings →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
