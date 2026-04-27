import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SeriesCard from '../components/series/SeriesCard'
import type { Series, Photo } from '../types'

interface SeriesWithPhotos extends Series {
  photos: Photo[]
  photoCount: number
}

function SkeletonCard() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-pulse">
      <div className="grid grid-cols-2 gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square bg-neutral-800" />
        ))}
      </div>
      <div className="p-4 space-y-2">
        <div className="h-4 bg-neutral-800 rounded w-3/4" />
        <div className="h-3 bg-neutral-800 rounded w-full" />
        <div className="h-3 bg-neutral-800 rounded w-1/2" />
      </div>
    </div>
  )
}

export default function AllSeriesPage() {
  const [seriesList, setSeriesList] = useState<SeriesWithPhotos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSeries() {
      setLoading(true)

      // Fetch all series
      const { data: seriesData } = await supabase
        .from('series')
        .select('*')
        .order('created_at', { ascending: false })

      if (!seriesData) {
        setLoading(false)
        return
      }

      // For each series, fetch first 4 photos + count
      const enriched: SeriesWithPhotos[] = await Promise.all(
        seriesData.map(async (s: Series) => {
          const { data: spData, count } = await supabase
            .from('series_photos')
            .select('photos(*)', { count: 'exact' })
            .eq('series_id', s.id)
            .order('position', { ascending: true })
            .limit(4)

          const photos: Photo[] = (spData ?? []).map(
            (row: any) => row.photos as Photo
          )

          return {
            ...s,
            photos,
            photoCount: count ?? 0,
          }
        })
      )

      setSeriesList(enriched)
      setLoading(false)
    }

    fetchSeries()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">All Series</h1>
          {!loading && (
            <p className="text-neutral-400 mt-1">
              {seriesList.length} series
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
            <p className="text-lg">No series yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {seriesList.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
