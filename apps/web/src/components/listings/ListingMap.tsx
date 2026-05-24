import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import type { Listing } from '../../utils/constants'
import { NAIROBI_CENTER } from '../../utils/constants'
import { formatKES, formatHouseType } from '../../utils/format'

// Fix default marker icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface ListingMapProps {
  listings: Listing[]
}

export function ListingMap({ listings }: ListingMapProps) {
  const withCoords = listings.filter((l) => l.lat && l.lng)

  return (
    <div className="hidden md:block h-[600px] rounded-2xl overflow-hidden border border-gray-200">
      <MapContainer
        center={NAIROBI_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((listing) => (
          <Marker key={listing.id} position={[listing.lat!, listing.lng!]}>
            <Popup>
              <div className="w-52">
                {listing.photos?.[0] && (
                  <img
                    src={listing.photos[0].url}
                    alt={listing.title}
                    className="w-full h-24 object-cover rounded-t"
                  />
                )}
                <div className="p-2">
                  <p className="font-semibold text-sm text-gray-900 leading-tight">{listing.title}</p>
                  <p className="text-primary font-bold text-sm mt-1">{formatKES(listing.rent)}/mo</p>
                  <p className="text-gray-500 text-xs">{listing.estate} · {formatHouseType(listing.house_type)}</p>
                  <Link
                    to={`/listings/${listing.id}`}
                    className="mt-2 block text-center text-xs bg-primary text-white rounded-lg py-1 font-medium hover:bg-green-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
