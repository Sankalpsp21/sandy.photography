import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PhotoGrid from '../components/photos/PhotoGrid'
import PhotoViewer from '../components/photos/PhotoViewer'
import ShareButton from '../components/photos/ShareButton'
import type { Series, Photo } from '../types'

export default function SeriesPage() {
  const { slug } = useParams<{ slug: string }>()
  const [series, setSeries] = useState<Series | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) return

    async function fetchSeries() {
      setLoading(true)
      setNotFound(false)

      const { data: seriesData } = await supabase
        .from('series')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!seriesData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setSeries(seriesData as Series)

      // Fetch photos ordered by series_photos.position
      const { data: spData } = await supabase
        .from('series_photos')
        .select('photos(*)')
        .eq('series_id', seriesData.id)
        .order('position', { ascending: true })

      const seriesPhotos: Photo[] = (spData ?? []).map(
        (row: any) => row.photos as Photo
      )
      setPhotos(seriesPhotos)
      setLoading(false)
    }

    fetchSeries()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center">
        <div className="text-theme-muted">Loading…</div>
      </div>
    )
  }

  if (notFound || !series) {
    return (
      <div className="min-h-screen bg-theme flex flex-col items-center justify-center text-theme">
        <h1 className="text-2xl font-semibold mb-2">Series not found</h1>
        <p className="text-theme-muted">The series "{slug}" doesn't exist.</p>
      </div>
    )
  }

  const shareUrl = `${window.location.origin}/series/${series.slug}`

  return (
    <div className="min-h-screen bg-theme text-theme">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <h1 className="text-3xl font-semibold">{series.title}</h1>
          {series.description && (
            <p className="text-theme-muted max-w-2xl">{series.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-theme-muted">
            <span>{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
            <span>Created {new Date(series.created_at).toLocaleDateString()}</span>
            {series.updated_at && series.updated_at !== series.created_at && (
              <span>Updated {new Date(series.updated_at).toLocaleDateString()}</span>
            )}
            <ShareButton title={series.title} url={shareUrl} text={series.description} />
          </div>
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-theme-muted">
            <p>No photos in this series yet.</p>
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
