import { useState } from 'react'
import type { Photo } from '../../types'
import { cloudinaryUrl, cloudinaryBlurUrl } from '../../lib/cloudinary'

interface PhotoCardProps {
  photo: Photo
  onClick: (photo: Photo) => void
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false)

  // Use the stored secure_url directly if available, otherwise build from cloudinary_id
  const fullSrc = photo.secure_url || cloudinaryUrl(photo.cloudinary_id, { width: 800 })
  const blurSrc = cloudinaryBlurUrl(photo.cloudinary_id)

  return (
    <div
      className="relative cursor-pointer rounded-sm overflow-hidden group"
      style={{ aspectRatio: `${photo.width}/${photo.height}` }}
      onClick={() => onClick(photo)}
    >
      {/* Blur placeholder — shown until full image loads */}
      {!loaded && (
        <div
          className="absolute inset-0 w-full h-full bg-theme-elevated"
          style={{
            backgroundImage: `url(${blurSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            transform: 'scale(1.05)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Full image */}
      <img
        src={fullSrc}
        alt={photo.title ?? photo.description ?? 'Photo'}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
      />

      {/* Hover overlay with description */}
      {photo.description && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <p className="text-white text-sm line-clamp-2">{photo.description}</p>
        </div>
      )}
    </div>
  )
}
