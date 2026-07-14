import { Link } from 'react-router-dom'
import type { Series, Photo } from '../../types'
import { cloudinaryUrl } from '../../lib/cloudinary'

interface SeriesCardProps {
  series: Series & { photos: Photo[]; photoCount: number }
}

export default function SeriesCard({ series }: SeriesCardProps) {
  const previewPhotos = series.photos.slice(0, 4)

  return (
    <div className="bg-theme-subtle border border-theme rounded-xl overflow-hidden hover:border-neutral-600 transition-colors group">
      {/* 2x2 preview grid */}
      <Link to={`/series/${series.slug}`} className="block">
        <div className="grid grid-cols-2 gap-0.5 group-hover:scale-[1.01] transition-transform duration-300">
          {previewPhotos.length === 0 ? (
            <div className="col-span-2 aspect-square bg-theme-elevated flex items-center justify-center">
              <span className="text-neutral-600 text-sm">No photos</span>
            </div>
          ) : previewPhotos.length === 1 ? (
            <div className="col-span-2 aspect-square overflow-hidden">
              <img
                src={cloudinaryUrl(previewPhotos[0].cloudinary_id, { width: 300 })}
                alt={previewPhotos[0].title ?? `Photo in ${series.title}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            previewPhotos.map((photo, i) => (
              <div
                key={photo.id}
                className={`aspect-square overflow-hidden ${
                  previewPhotos.length === 3 && i === 2 ? 'col-span-2' : ''
                }`}
              >
                <img
                  src={cloudinaryUrl(photo.cloudinary_id, { width: 300 })}
                  alt={photo.title ?? `Photo in ${series.title}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          )}
        </div>
      </Link>

      {/* Metadata */}
      <div className="p-4 space-y-1.5">
        <Link
          to={`/series/${series.slug}`}
          className="block text-theme font-semibold hover:text-neutral-200 transition-colors"
        >
          {series.title}
        </Link>

        {series.description && (
          <p className="text-theme-muted text-sm line-clamp-2">{series.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-theme-subtle pt-1">
          <span>
            {series.photoCount} photo{series.photoCount !== 1 ? 's' : ''}
          </span>
          <div className="text-right space-y-0.5">
            <div>Created {new Date(series.created_at).toLocaleDateString()}</div>
            {series.updated_at && series.updated_at !== series.created_at && (
              <div>Updated {new Date(series.updated_at).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
