import { Link } from 'react-router-dom'
import logoSrc from '../../assets/logo.svg'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <img src={logoSrc} alt="MakaziHub" className="h-8 w-auto brightness-200 mb-4" />
            <p className="text-sm leading-relaxed">
              Kenya's most trusted rental housing marketplace. Find verified listings across Nairobi.
            </p>
            <p className="text-xs mt-4 text-gray-500">makazihub.co.ke</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">For Tenants</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/listings" className="hover:text-white transition-colors">Browse Listings</Link></li>
              <li><Link to="/auth/signup" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/tenant/alerts" className="hover:text-white transition-colors">Search Alerts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">For Listers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/auth/signup" className="hover:text-white transition-colors">List a Property</Link></li>
              <li><Link to="/lister/dashboard" className="hover:text-white transition-colors">Lister Dashboard</Link></li>
              <li><Link to="/lister/billing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">© {year} MakaziHub. All rights reserved. Nairobi, Kenya.</p>
          <div className="flex items-center gap-4 text-sm">
            <a href="https://instagram.com/MakaziHubKenya" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <a href="https://x.com/MakaziHub" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">X</a>
            <a href="https://facebook.com/MakaziHub" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
