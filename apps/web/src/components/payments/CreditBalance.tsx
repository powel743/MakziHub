import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function CreditBalance() {
  const { user } = useAuth()
  const credits = user?.tenant_profile?.free_credits ?? 0

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
      <Zap className="w-4 h-4 text-amber-500" />
      <span className="text-sm font-medium text-amber-700">
        {credits} credit{credits !== 1 ? 's' : ''} remaining
      </span>
      {credits < 3 && (
        <Link
          to="/tenant/billing"
          className="text-xs text-amber-600 underline hover:text-amber-800 ml-1"
        >
          Top up
        </Link>
      )}
    </div>
  )
}
