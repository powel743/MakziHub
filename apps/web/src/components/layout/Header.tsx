import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationDropdown } from '../notifications/NotificationDropdown'
import logoSrc from '../../assets/logo.svg'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const dashboardPath = user?.role === 'admin'
    ? '/admin/dashboard'
    : user?.role === 'tenant'
    ? '/tenant/dashboard'
    : '/lister/dashboard'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src={logoSrc} alt="MakaziHub" className="h-8 w-auto" />
          </Link>

          {/* Nav links desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/listings" className="hover:text-primary transition-colors">Browse</Link>
            <Link to="/listings?sort=featured" className="hover:text-primary transition-colors">Featured</Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false) }}
                    className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false) }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <Link
                        to={dashboardPath}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => { logout(); navigate('/') }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="hidden sm:block text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                  List Property
                </Link>
              </>
            )}

            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <Link to="/listings" className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMobileOpen(false)}>Browse Listings</Link>
          {!isAuthenticated && (
            <Link to="/auth/login" className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMobileOpen(false)}>Sign In</Link>
          )}
        </div>
      )}
    </header>
  )
}
