import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { slugify } from '../../lib/utils'
import { cloudinaryUrl } from '../../lib/cloudinary'
import type { Series, Photo } from '../../types'

interface SeriesWithCount extends Series {
  photoCount: number
  photos: Photo[]
}

interface SeriesFormData {
  title: string
  description: string
  slug: string
}

// Modal for adding photos to a series
function AddPhotosModal({
  seriesId,
  existingPhotoIds,
  onClose,
  onAdded,
}: {
  seriesId: string
  existingPhotoIds: Set<string>
  onClose: () => void
  onAdded: () => void
}) {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('photos')
      .select('*')
      .order('upload_date', { ascending: false })
      .then(({ data }) => {
        if (data) setAllPhotos(data as Photo[])
      })
  }, [])

  async function handleAdd() {
    if (selected.size === 0) return
    setSaving(true)

    // Get current max position
    const { data: existing } = await supabase
      .from('series_photos')
      .select('position')
      .eq('series_id', seriesId)
      .order('position', { ascending: false })
      .limit(1)

    let nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0

    const rows = Array.from(selected).map((photoId) => ({
      series_id: seriesId,
      photo_id: photoId,
      position: nextPos++,
    }))

    await supabase.from('series_photos').insert(rows)
    setSaving(false)
    onAdded()
    onClose()
  }

  const available = allPhotos.filter((p) => !existingPhotoIds.has(p.id))

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-neutral-700">
          <h3 className="text-white font-semibold">Add Photos to Series</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {available.length === 0 ? (
            <p className="text-neutral-400 text-center py-8">No photos available to add.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {available.map((photo) => {
                const isSelected = selected.has(photo.id)
                return (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (isSelected) next.delete(photo.id)
                        else next.add(photo.id)
                        return next
                      })
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      isSelected ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={cloudinaryUrl(photo.cloudinary_id, { width: 200 })}
                      alt={photo.title ?? ''}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                        <Check size={24} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {saving ? 'Adding…' : `Add ${selected.size > 0 ? selected.size : ''} Photo${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SeriesManager() {
  const [seriesList, setSeriesList] = useState<SeriesWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeries, setSelectedSeries] = useState<SeriesWithCount | null>(null)
  const [seriesPhotos, setSeriesPhotos] = useState<Photo[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<SeriesFormData>({ title: '', description: '', slug: '' })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const fetchSeries = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('series')
      .select('*, series_photos(count)')
      .order('created_at', { ascending: false })

    if (data) {
      const enriched: SeriesWithCount[] = (data as Array<Series & { series_photos: Array<{ count: number }> }>).map((s) => ({
        ...s,
        photoCount: s.series_photos?.[0]?.count ?? 0,
        photos: [],
      }))
      setSeriesList(enriched)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSeries()
  }, [fetchSeries])

  async function fetchSeriesPhotos(seriesId: string) {
    const { data } = await supabase
      .from('series_photos')
      .select('position, photos(*)')
      .eq('series_id', seriesId)
      .order('position', { ascending: true })

    if (data) {
      const photos = data.map((row: any) => row.photos as Photo)
      setSeriesPhotos(photos)
    }
  }

  function selectSeries(s: SeriesWithCount) {
    setSelectedSeries(s)
    fetchSeriesPhotos(s.id)
  }

  function startCreate() {
    setEditingId(null)
    setForm({ title: '', description: '', slug: '' })
    setSlugManuallyEdited(false)
  }

  function startEdit(s: SeriesWithCount) {
    setEditingId(s.id)
    setForm({ title: s.title, description: s.description ?? '', slug: s.slug })
    setSlugManuallyEdited(true)
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : slugify(title),
    }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)

    if (editingId) {
      await supabase
        .from('series')
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          slug: form.slug.trim() || slugify(form.title),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)
    } else {
      await supabase.from('series').insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        slug: form.slug.trim() || slugify(form.title),
      })
    }

    setSaving(false)
    setEditingId(null)
    setForm({ title: '', description: '', slug: '' })
    setSlugManuallyEdited(false)
    fetchSeries()
  }

  async function handleDelete(id: string) {
    await supabase.from('series').delete().eq('id', id)
    setConfirmDeleteId(null)
    if (selectedSeries?.id === id) {
      setSelectedSeries(null)
      setSeriesPhotos([])
    }
    fetchSeries()
  }

  async function removePhotoFromSeries(photoId: string) {
    if (!selectedSeries) return
    await supabase
      .from('series_photos')
      .delete()
      .eq('series_id', selectedSeries.id)
      .eq('photo_id', photoId)
    fetchSeriesPhotos(selectedSeries.id)
    fetchSeries()
  }

  async function movePhoto(photoId: string, direction: 'up' | 'down') {
    if (!selectedSeries) return
    const idx = seriesPhotos.findIndex((p) => p.id === photoId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= seriesPhotos.length) return

    const photoA = seriesPhotos[idx]
    const photoB = seriesPhotos[swapIdx]

    // Swap positions
    await supabase
      .from('series_photos')
      .update({ position: swapIdx })
      .eq('series_id', selectedSeries.id)
      .eq('photo_id', photoA.id)

    await supabase
      .from('series_photos')
      .update({ position: idx })
      .eq('series_id', selectedSeries.id)
      .eq('photo_id', photoB.id)

    fetchSeriesPhotos(selectedSeries.id)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-8">Series Manager</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: series list + form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create/Edit form */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-3">
              <h2 className="text-white font-medium">
                {editingId ? 'Edit Series' : 'Create Series'}
              </h2>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Series title"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true)
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }}
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
                </button>
                {editingId && (
                  <button
                    onClick={startCreate}
                    className="px-3 py-2 text-neutral-400 hover:text-white border border-neutral-600 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Series list */}
            <div className="space-y-2">
              {loading ? (
                <div className="text-neutral-400 text-sm">Loading…</div>
              ) : seriesList.length === 0 ? (
                <div className="text-neutral-400 text-sm">No series yet.</div>
              ) : (
                seriesList.map((s) => (
                  <div
                    key={s.id}
                    className={`bg-neutral-900 border rounded-xl p-4 cursor-pointer transition-colors ${
                      selectedSeries?.id === s.id
                        ? 'border-blue-500'
                        : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                    onClick={() => selectSeries(s)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{s.title}</p>
                        <p className="text-neutral-400 text-xs mt-0.5">
                          {s.photoCount} photo{s.photoCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(s)
                          }}
                          className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                          aria-label="Edit series"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDeleteId(s.id)
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
                          aria-label="Delete series"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Delete confirmation */}
                    {confirmDeleteId === s.id && (
                      <div
                        className="mt-3 pt-3 border-t border-neutral-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-sm text-red-400 mb-2">Delete this series?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1 text-neutral-400 hover:text-white text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: photos in selected series */}
          <div className="lg:col-span-2">
            {!selectedSeries ? (
              <div className="flex items-center justify-center h-64 text-neutral-500">
                Select a series to manage its photos
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-medium">{selectedSeries.title}</h2>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    Add Photos
                  </button>
                </div>

                {seriesPhotos.length === 0 ? (
                  <p className="text-neutral-400 text-sm">No photos in this series yet.</p>
                ) : (
                  <div className="space-y-2">
                    {seriesPhotos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="flex items-center gap-3 bg-neutral-800 rounded-lg p-2"
                      >
                        <img
                          src={cloudinaryUrl(photo.cloudinary_id, { width: 80 })}
                          alt={photo.title ?? ''}
                          className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {photo.title ?? photo.cloudinary_id}
                          </p>
                          {photo.capture_date && (
                            <p className="text-neutral-400 text-xs">
                              {new Date(photo.capture_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => movePhoto(photo.id, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                            aria-label="Move up"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            onClick={() => movePhoto(photo.id, 'down')}
                            disabled={idx === seriesPhotos.length - 1}
                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                            aria-label="Move down"
                          >
                            <ChevronDown size={16} />
                          </button>
                          <button
                            onClick={() => removePhotoFromSeries(photo.id)}
                            className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                            aria-label="Remove from series"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && selectedSeries && (
        <AddPhotosModal
          seriesId={selectedSeries.id}
          existingPhotoIds={new Set(seriesPhotos.map((p) => p.id))}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            fetchSeriesPhotos(selectedSeries.id)
            fetchSeries()
          }}
        />
      )}
    </div>
  )
}
