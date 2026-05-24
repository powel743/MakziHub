import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

interface SidebarItem {
  path: string
  label: string
  icon: ReactNode
  planRequired?: 'pro' | 'business'
}

interface SidebarProps {
  items: SidebarItem[]
  userPlan?: string
}

export function Sidebar({ items, userPlan }: SidebarProps) {
  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 min-h-screen hidden lg:block">
      <nav className="p-4 space-y-1">
        {items.map((item) => {
          const locked = item.planRequired && userPlan !== item.planRequired && userPlan !== 'business'
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  locked && 'opacity-50 pointer-events-none'
                )
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
              {locked && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                  {item.planRequired}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
