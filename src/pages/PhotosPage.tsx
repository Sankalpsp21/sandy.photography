import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import type { Photo } from '../types'
import { supabase } from '../lib/supabase'
import PhotoGrid from '../components/photos/PhotoGrid'
import PhotoViewer from '../components/photos/PhotoViewer'

export default function PhotosPage() {
  const { filter } = useParams<{ filter?: string }>()
  const navigate = useNavigate()

  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [allTags, setAllTags] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState(filter ?? '')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  // Fetch all photos for tag extraction and count
  useEffect(() => {
    async function fetchPhotos() {
      setLoading(true)
      const { data } = await supabase
        .from('photos')
        .select('*')
        .order('upload_date', { ascending: false })

      if (data) {
        setPhotos(data as Photo[])
        // Extract unique tags
        const tagSet = new Set<string>()
        for (const photo of data as Photo[]) {
          for (const tag of photo.tags ?? []) {
            tagSet.add(tag)
          }
        }
        setAllTags(Array.from(tagSet).sort())
      }
      setLoading(false)
    }

    fetchPhotos()
  }, [])

  // Sync search input with URL filter
  useEffect(() => {
    setSearchInput(filter ?? '')
  }, [filter])

  const filteredPhotos = filter
    ? photos.filter((p) =>
        p.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase())) ||
        (p.title ?? '').toLowerCase().includes(filter.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(filter.toLowerCase())
      )
    : photos

  function handleTagClick(tag: string) {
    if (filter === tag) {
      navigate('/photos')
    } else {
      navigate(`/photos/${encodeURIComponent(tag)}`)
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const term = searchInput.trim()
    if (term) {
      navigate(`/photos/${encodeURIComponent(term)}`)
    } else {
      navigate('/photos')
    }
  }

  const handlePhotoClick = useCallback(
    (photo: Photo) => {
      const idx = filteredPhotos.findIndex((p) => p.id === photo.id)
      if (idx !== -1) setViewerIndex(idx)
    },
    [filteredPhotos]
  )

  return (
    <div className="min-h-screen bg-theme text-theme">
      {/* Padded header area */}
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-1">
            All Photos
            {!loading && (
              <span className="text-theme-subtle text-xl font-normal ml-3">
                {filteredPhotos.length}
              </span>
            )}
          </h1>
          {filter && (
            <p className="text-theme-subtle text-sm">
              Filtered by:{' '}
              <span className="text-theme font-medium">{filter}</span>
              <button
                onClick={() => navigate('/photos')}
                className="ml-2 text-neutral-400 hover:text-theme transition-colors"
                aria-label="Clear filter"
              >
                <X size={14} className="inline" />
              </button>
            </p>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search photos…"
              className="w-full bg-theme-subtle border border-theme rounded-lg pl-9 pr-4 py-2 text-sm text-theme placeholder-[var(--fg-subtle)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-theme-subtle hover:bg-theme-elevated rounded-lg text-sm transition-colors min-h-[44px]"
          >
            Search
          </button>
        </form>

        {/* Tag filter bar */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => navigate('/photos')}
              className={`px-3 py-1 rounded-full text-sm transition-colors min-h-[36px] ${
                !filter
                  ? '[background:var(--fg)] text-[var(--bg)] font-medium'
                  : 'bg-theme-subtle text-theme-muted hover:bg-theme-elevated'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors min-h-[36px] ${
                  filter === tag
                    ? '[background:var(--fg)] text-[var(--bg)] font-medium'
                    : 'bg-theme-subtle text-theme-muted hover:bg-theme-elevated'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edge-to-edge photo grid — no horizontal padding */}
      <PhotoGrid
        photos={filteredPhotos}
        onPhotoClick={handlePhotoClick}
        filter={undefined}
      />

      {/* Photo viewer */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={filteredPhotos}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}
