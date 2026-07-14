import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import type { Photo, Series } from '../../types'
import { cloudinaryFullResUrl } from '../../lib/cloudinary'
import { slugify } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import KudosButton from './KudosButton'
import ShareButton from './ShareButton'

interface PhotoViewerProps {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

function hasExif(photo: Photo): boolean {
  return !!(
    photo.camera_make ||
    photo.camera_model ||
    photo.lens_make ||
    photo.lens_model ||
    photo.aperture ||
    photo.shutter_speed ||
    photo.iso ||
    photo.focal_length_native
  )
}

export default function PhotoViewer({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: PhotoViewerProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [series, setSeries] = useState<Series | null>(null)
  const touchStartX = useRef<number | null>(null)
  const photo = photos[currentIndex]

  // Fetch series for current photo
  useEffect(() => {
    setSeries(null)
    if (!photo) return

    async function fetchSeries() {
      const { data } = await supabase
        .from('series_photos')
        .select('series:series_id(*)')
        .eq('photo_id', photo.id)
        .limit(1)
        .single()

      if (data?.series) {
        setSeries(data.series as unknown as Series)
      }
    }

    fetchSeries()
  }, [photo])

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1)
  }, [currentIndex, photos.length, onNavigate])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1)
  }, [currentIndex, onNavigate])

  const toggleFullscreen = useCallback(() => {
    setFullscreen((f) => !f)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      else if (e.key === 'Escape') {
        if (fullscreen) {
          setFullscreen(false)
        } else {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, toggleFullscreen, fullscreen, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Touch swipe support
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  if (!photo) return null

  const showExif = hasExif(photo)
  const shareUrl = `${window.location.origin}/photo/${photo.id}`
  // Use stored secure_url directly for full resolution; fall back to built URL
  const fullResUrl = photo.secure_url || cloudinaryFullResUrl(photo.cloudinary_id)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {fullscreen ? (
        /* Fullscreen mode: photo edge-to-edge, minimal UI */
        <div
          className="relative w-full h-full flex items-center justify-center cursor-pointer"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={fullResUrl}
            alt={photo.title ?? photo.description ?? 'Photo'}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm select-none pointer-events-none">
            Press Esc or click to exit
          </div>
        </div>
      ) : (
        /* Normal mode: photo + metadata panel */
        <>
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Main content */}
          <div
            className="relative z-10 flex flex-col md:flex-row w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo area */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-0">
              <img
                src={fullResUrl}
                alt={photo.title ?? photo.description ?? 'Photo'}
                className="max-w-full max-h-full object-contain rounded-sm"
                style={{ maxHeight: 'calc(100vh - 2rem)' }}
              />
            </div>

            {/* Metadata panel */}
            {showExif && (
              <aside className="w-full md:w-80 lg:w-96 bg-white/5 backdrop-blur-md border-l border-white/10 overflow-y-auto flex-shrink-0 p-6 flex flex-col gap-4">
                {/* Title & description */}
                {photo.title && (
                  <h2 className="text-white text-xl font-semibold">{photo.title}</h2>
                )}
                {photo.description && (
                  <p className="text-neutral-300 text-sm">{photo.description}</p>
                )}

                {/* Series */}
                {series && (
                  <div className="text-sm">
                    <span className="text-neutral-400">Series: </span>
                    <Link
                      to={`/series/${series.slug}`}
                      className="text-blue-400 hover:text-blue-300 underline"
                      onClick={onClose}
                    >
                      {series.title}
                    </Link>
                  </div>
                )}

                {/* Camera */}
                {(photo.camera_make || photo.camera_model) && (
                  <div className="text-sm">
                    <span className="text-neutral-400">Camera: </span>
                    <Link
                      to={`/cameras/${slugify(photo.camera_make ?? '')}/${slugify(photo.camera_model ?? '')}`}
                      className="text-white hover:text-neutral-300"
                      onClick={onClose}
                    >
                      {[photo.camera_make, photo.camera_model].filter(Boolean).join(' ')}
                    </Link>
                  </div>
                )}

                {/* Lens */}
                {(photo.lens_make || photo.lens_model) && (
                  <div className="text-sm">
                    <span className="text-neutral-400">Lens: </span>
                    <Link
                      to={`/lenses/${slugify(photo.lens_make ?? '')}/${slugify(photo.lens_model ?? '')}`}
                      className="text-white hover:text-neutral-300"
                      onClick={onClose}
                    >
                      {[photo.lens_make, photo.lens_model].filter(Boolean).join(' ')}
                    </Link>
                  </div>
                )}

                {/* Camera settings */}
                {(photo.focal_length_native || photo.aperture || photo.shutter_speed || photo.iso) && (
                  <div className="text-sm text-neutral-300 bg-white/5 rounded p-3 space-y-1">
                    {photo.focal_length_native && (
                      <div>
                        {photo.focal_length_native}mm
                        {photo.focal_length_equiv && photo.focal_length_equiv !== photo.focal_length_native
                          ? ` (${Math.round(photo.focal_length_equiv)}mm eq.)`
                          : ''}
                      </div>
                    )}
                    {photo.aperture && <div>ƒ/{photo.aperture}</div>}
                    {photo.shutter_speed && <div>{photo.shutter_speed}s</div>}
                    {photo.iso && <div>ISO {photo.iso}</div>}
                  </div>
                )}

                {/* Dates */}
                <div className="text-xs text-neutral-500 space-y-1">
                  {photo.capture_date && (
                    <div>Captured: {new Date(photo.capture_date).toLocaleDateString()}</div>
                  )}
                  <div>Uploaded: {new Date(photo.upload_date).toLocaleDateString()}</div>
                  {photo.updated_at && photo.updated_at !== photo.upload_date && (
                    <div>Updated: {new Date(photo.updated_at).toLocaleDateString()}</div>
                  )}
                </div>

                {/* Tags */}
                {photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {photo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white/10 text-neutral-300 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <KudosButton itemId={photo.id} itemType="photo" initialCount={0} />
                  <ShareButton
                    title={photo.title ?? 'Photo'}
                    url={shareUrl}
                    text={photo.description}
                  />
                </div>
              </aside>
            )}

            {/* If no EXIF, still show actions floating */}
            {!showExif && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                <KudosButton itemId={photo.id} itemType="photo" initialCount={0} />
                <ShareButton
                  title={photo.title ?? 'Photo'}
                  url={shareUrl}
                  text={photo.description}
                />
              </div>
            )}
          </div>

          {/* Controls */}
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Fullscreen toggle */}
          <button
            className="absolute top-4 right-14 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <Maximize2 size={20} />
          </button>

          {/* Prev button */}
          {currentIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white/50"
              onClick={goPrev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Next button */}
          {currentIndex < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white/50"
              onClick={goNext}
              aria-label="Next photo"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </>
      )}

      {/* Fullscreen exit button */}
      {fullscreen && (
        <button
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white/50"
          onClick={() => setFullscreen(false)}
          aria-label="Exit fullscreen"
        >
          <Minimize2 size={20} />
        </button>
      )}
    </div>
  )
}
