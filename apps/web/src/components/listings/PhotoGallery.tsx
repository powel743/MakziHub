import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Thumbs, FreeMode } from 'swiper/modules'
import { useState } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import type { ListingPhoto } from '../../utils/constants'
import { Home } from 'lucide-react'

// Swiper styles via CDN - imported in index.html is not available, use style tags
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'

interface PhotoGalleryProps {
  photos: ListingPhoto[]
  title?: string
}

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)

  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Home className="w-16 h-16 mx-auto mb-2" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Swiper
        modules={[Navigation, Thumbs, FreeMode]}
        navigation
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        className="aspect-[16/9] rounded-2xl overflow-hidden"
        style={{ '--swiper-navigation-color': '#16a34a' } as React.CSSProperties}
      >
        {photos.map((photo) => (
          <SwiperSlide key={photo.id}>
            <img
              src={photo.url}
              alt={title || 'Listing photo'}
              className="w-full h-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {photos.length > 1 && (
        <Swiper
          modules={[FreeMode, Thumbs]}
          onSwiper={setThumbsSwiper}
          spaceBetween={8}
          slidesPerView={Math.min(photos.length, 6)}
          freeMode
          watchSlidesProgress
          className="h-16"
        >
          {photos.map((photo) => (
            <SwiperSlide key={photo.id} className="cursor-pointer opacity-60 [&.swiper-slide-thumb-active]:opacity-100">
              <img src={photo.url} alt="" className="w-full h-full object-cover rounded-lg" />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  )
}
