import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PhotoGrid from '../components/photos/PhotoGrid'
import PhotoViewer from '../components/photos/PhotoViewer'
import type { Photo } from '../types'

export default function CameraBrowsePage() {
  const { make, model } = useParams<{ make: string; model: string }>()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  // Decode URL params (slugified) back to display strings
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
        .ilike('camera_make', displayMake)
        .ilike('camera_model', displayModel)
        .order('upload_date', { ascending: false })

      setPhotos((data as Photo[]) ?? [])
      setLoading(false)
    }

    fetchPhotos()
  }, [make, model, displayMake, displayModel])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold capitalize">{heading || 'Camera'}</h1>
          {!loading && (
            <p className="text-neutral-400 mt-1">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400">
            Loading…
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
            <p className="text-lg">No photos found for this camera.</p>
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
