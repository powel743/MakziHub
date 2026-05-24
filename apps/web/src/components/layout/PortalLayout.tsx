import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface PortalLayoutProps {
  children: ReactNode
  sidebarItems: { path: string; label: string; icon: ReactNode; planRequired?: 'pro' | 'business' }[]
  userPlan?: string
  title: string
}

export function PortalLayout({ children, sidebarItems, userPlan, title }: PortalLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      <Sidebar items={sidebarItems} userPlan={userPlan} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 font-display mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  )
}
