import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PhotoGrid from '../components/photos/PhotoGrid'
import PhotoViewer from '../components/photos/PhotoViewer'
import type { Photo } from '../types'

export default function LensBrowsePage() {
  const { make, model } = useParams<{ make: string; model: string }>()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const displayMake = make ? decodeURIComponent(make).replace(/-/g, ' ') : ''
  const displayModel = model ? decodeURIComponent(model).replace(/-/g, ' ') : ''
  const heading = [displayMake, displayModel].filter(Boolean).join(' ')

  useEffect(() => {
    if (!make || !model) return

    async function fetchPhotos() {
      setLoading(true)

      const { data } = await supabase
        .from('photos')
        .select('*')
        .ilike('lens_make', displayMake)
        .ilike('lens_model', displayModel)
        .order('upload_date', { ascending: false })

      setPhotos((data as Photo[]) ?? [])
      setLoading(false)
    }

    fetchPhotos()
  }, [make, model, displayMake, displayModel])

  return (
    <div className="min-h-screen bg-theme text-theme">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold capitalize">{heading || 'Lens'}</h1>
          {!loading && (
            <p className="text-theme-muted mt-1">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-theme-muted">
            Loading…
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-theme-muted">
            <p className="text-lg">No photos found for this lens.</p>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            onPhotoClick={(photo) => {
              const idx = photos.findIndex((p) => p.id === photo.id)
              setViewerIndex(idx >= 0 ? idx : 0)
            }}
          />
        )}
      </div>

      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}
