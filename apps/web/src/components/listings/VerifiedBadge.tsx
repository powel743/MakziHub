import { CheckCircle, Phone, ShieldCheck } from 'lucide-react'
import type { VerifiedTier } from '../../utils/constants'
import clsx from 'clsx'

interface VerifiedBadgeProps {
  tier: VerifiedTier
  size?: 'sm' | 'md'
}

export function VerifiedBadge({ tier, size = 'sm' }: VerifiedBadgeProps) {
  if (tier === 'none') return null

  const config = {
    phone: {
      label: 'Phone Verified',
      color: 'text-gray-500 bg-gray-100 border-gray-200',
      icon: <Phone className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
    },
    id: {
      label: 'ID Verified',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: <CheckCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
    },
    visited: {
      label: 'Inspected',
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
    },
  }[tier]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.color,
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      )}
    >
      {config.icon}
      {config.label}
    </span>
  )
}
