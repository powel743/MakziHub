import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Crumb } from '../seo/BreadcrumbJsonLd'

/**
 * Visible breadcrumb trail. The last item renders as plain text (current page).
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-sm text-gray-500">
      {items.map((c, i) => {
        const last = i === items.length - 1
        return (
          <span key={c.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
            {last ? (
              <span className="text-gray-700 font-medium truncate max-w-[200px]">{c.name}</span>
            ) : (
              <Link to={c.path} className="hover:text-primary">{c.name}</Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
