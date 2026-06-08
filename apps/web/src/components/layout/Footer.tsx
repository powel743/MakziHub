import { Link } from 'react-router-dom'
import { Twitter, Instagram, Facebook } from 'lucide-react'
import logoSrc from '../../assets/logo.svg'

const SOCIALS = [
  { label: 'X (Twitter)', href: 'https://x.com/MakaziHubKE_', icon: <Twitter className="w-5 h-5" /> },
  { label: 'Instagram', href: 'https://www.instagram.com/makazihubke_', icon: <Instagram className="w-5 h-5" /> },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61590219427611', icon: <Facebook className="w-5 h-5" /> },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@makazihubke_',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.6c.27 0 .53.04.78.12V9.66a5.7 5.7 0 0 0-.78-.05 5.69 5.69 0 1 0 5.69 5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.25-1.48z" />
      </svg>
    ),
  },
]

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
          <div className="flex items-center gap-4">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
