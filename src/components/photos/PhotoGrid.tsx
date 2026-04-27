import { useEffect, useState } from 'react'
import type { Photo } from '../../types'
import { supabase } from '../../lib/supabase'
import { usePhotoGrid } from '../../hooks/usePhotoGrid'
import PhotoCard from './PhotoCard'

interface PhotoGridProps {
  photos?: Photo[]
  onPhotoClick: (photo: Photo) => void
  filter?: string
}

function SkeletonCard() {
  return (
    <div className="rounded-sm bg-neutral-800 animate-pulse" style={{ aspectRatio: '4/3' }} />
  )
}

export default function PhotoGrid({ photos: photosProp, onPhotoClick, filter }: PhotoGridProps) {
  const [fetchedPhotos, setFetchedPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(!photosProp)

  useEffect(() => {
    if (photosProp) return

    let cancelled = false

    async function fetchPhotos() {
      setLoading(true)
      const { data } = await supabase
        .from('photos')
        .select('*')
        .order('upload_date', { ascending: false })

      if (!cancelled && data) {
        setFetchedPhotos(data as Photo[])
      }
      if (!cancelled) setLoading(false)
    }

    fetchPhotos()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('photos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos' },
        () => {
          fetchPhotos()
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [photosProp])

  const sourcePhotos = photosProp ?? fetchedPhotos

  // Apply filter
  const filteredPhotos = filter
    ? sourcePhotos.filter((p) =>
        p.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))
      )
    : sourcePhotos

  const { columns, containerRef } = usePhotoGrid(filteredPhotos)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!loading && filteredPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
        <p className="text-lg">No photos found{filter ? ` for "${filter}"` : ''}.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex gap-2 p-2 items-start">
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-2 flex-1 min-w-0">
          {col.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onClick={onPhotoClick} />
          ))}
        </div>
      ))}
    </div>
  )
}
