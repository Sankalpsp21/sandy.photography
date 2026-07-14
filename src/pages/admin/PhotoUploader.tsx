import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import UploadZone from '../../components/admin/UploadZone'
import { uploadPhoto } from '../../lib/upload'
import type { UploadProgress, PhotoMetadata } from '../../lib/upload'
import { extractExif, getCropFactor, formatShutterSpeed } from '../../lib/exif'
import type { Series } from '../../types'
import { supabase } from '../../lib/supabase'

interface ExifPreview {
  cameraMake?: string
  cameraModel?: string
  lensMake?: string
  lensModel?: string
  aperture?: string
  shutterSpeed?: string
  iso?: number
  focalLength?: number
  focalLengthEquiv?: number
  captureDate?: string
}

interface FileEntry {
  id: string
  file: File
  metadata: PhotoMetadata
  exif?: ExifPreview
  progress: UploadProgress
}

function MetadataForm({
  entry,
  series,
  onChange,
}: {
  entry: FileEntry
  series: Series[]
  onChange: (meta: PhotoMetadata) => void
}) {
  const m = entry.metadata
  const exif = entry.exif

  function update(patch: Partial<PhotoMetadata>) {
    onChange({ ...m, ...patch })
  }

  const prog = entry.progress
  const isDone = prog.status === 'done'
  const isError = prog.status === 'error'
  const isUploading = prog.status === 'uploading'

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-4">
      {/* File name header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-white font-medium truncate">{entry.file.name}</span>
        {isDone && <CheckCircle size={20} className="text-green-400 flex-shrink-0" />}
        {isError && <XCircle size={20} className="text-red-400 flex-shrink-0" />}
      </div>

      {/* EXIF preview — read-only display of what was extracted */}
      {exif && (exif.cameraMake || exif.cameraModel || exif.aperture || exif.focalLength) ? (
        <div className="bg-neutral-800/60 rounded-lg px-4 py-3 text-xs text-neutral-400 space-y-1">
          <p className="text-neutral-300 font-medium text-xs uppercase tracking-wide mb-2">Extracted from EXIF</p>
          {(exif.cameraMake || exif.cameraModel) && (
            <div><span className="text-neutral-500">Camera: </span>{[exif.cameraMake, exif.cameraModel].filter(Boolean).join(' ')}</div>
          )}
          {(exif.lensMake || exif.lensModel) && (
            <div><span className="text-neutral-500">Lens: </span>{[exif.lensMake, exif.lensModel].filter(Boolean).join(' ')}</div>
          )}
          {(exif.focalLength || exif.aperture || exif.shutterSpeed || exif.iso) && (
            <div>
              {[
                exif.focalLength && `${exif.focalLength}mm${exif.focalLengthEquiv && exif.focalLengthEquiv !== exif.focalLength ? ` (${exif.focalLengthEquiv}mm eq.)` : ''}`,
                exif.aperture && `ƒ/${exif.aperture}`,
                exif.shutterSpeed && formatShutterSpeed(parseFloat(exif.shutterSpeed)),
                exif.iso && `ISO ${exif.iso}`,
              ].filter(Boolean).join(' · ')}
            </div>
          )}
          {exif.captureDate && (
            <div><span className="text-neutral-500">Date: </span>{exif.captureDate}</div>
          )}
        </div>
      ) : exif !== undefined ? (
        <p className="text-xs text-neutral-600 italic">No EXIF data found — fill in details manually (e.g. film scan or stripped metadata)</p>
      ) : null}

      {/* Progress bar */}
      {(isUploading || isDone) && (
        <div className="w-full bg-neutral-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${prog.progress}%` }}
          />
        </div>
      )}

      {isError && (
        <p className="text-red-400 text-sm">{prog.error ?? 'Upload failed'}</p>
      )}

      {/* Metadata fields — disabled while uploading/done */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Title</label>
          <input
            type="text"
            value={m.title ?? ''}
            onChange={(e) => update({ title: e.target.value || undefined })}
            disabled={isUploading || isDone}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="Optional title"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1">Capture Date</label>
          <input
            type="date"
            value={m.captureDate ?? exif?.captureDate ?? ''}
            onChange={(e) => update({ captureDate: e.target.value || undefined })}
            disabled={isUploading || isDone}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-neutral-400 mb-1">Description</label>
          <textarea
            value={m.description ?? ''}
            onChange={(e) => update({ description: e.target.value || undefined })}
            disabled={isUploading || isDone}
            rows={2}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none"
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={m.tags?.join(', ') ?? ''}
            onChange={(e) =>
              update({
                tags: e.target.value
                  ? e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                  : undefined,
              })
            }
            disabled={isUploading || isDone}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="landscape, travel, ..."
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1">Series</label>
          <select
            value={m.seriesId ?? ''}
            onChange={(e) => update({ seriesId: e.target.value || undefined })}
            disabled={isUploading || isDone}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">None</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Camera — pre-filled from EXIF, editable */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Camera Make</label>
          <input
            type="text"
            value={m.cameraOverride?.make ?? ''}
            onChange={(e) =>
              update({
                cameraOverride: e.target.value
                  ? { make: e.target.value, model: m.cameraOverride?.model ?? '' }
                  : undefined,
              })
            }
            disabled={isUploading || isDone}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="e.g. Sony"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1">Camera Model</label>
          <input
            type="text"
            value={m.cameraOverride?.model ?? ''}
            onChange={(e) =>
              update({
                cameraOverride: e.target.value
                  ? { make: m.cameraOverride?.make ?? '', model: e.target.value }
                  : undefined,
              })
            }
            disabled={isUploading || isDone}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="e.g. A7 IV"
          />
        </div>

        {/* Lens — pre-filled from EXIF, editable */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Lens Make</label>
          <input
            type="text"
            value={m.lensOverride?.make ?? ''}
            onChange={(e) =>
              update({
                lensOverride: e.target.value
                  ? { make: e.target.value, model: m.lensOverride?.model ?? '' }
                  : undefined,
              })
            }
            disabled={isUploading || isDone}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="e.g. Sony"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1">Lens Model</label>
          <input
            type="text"
            value={m.lensOverride?.model ?? ''}
            onChange={(e) =>
              update({
                lensOverride: e.target.value
                  ? { make: m.lensOverride?.make ?? '', model: e.target.value }
                  : undefined,
              })
            }
            disabled={isUploading || isDone}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="e.g. 24-70mm f/2.8"
          />
        </div>
      </div>
    </div>
  )
}

export default function PhotoUploader() {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [uploading, setUploading] = useState(false)

  // Fetch existing series for dropdown
  useEffect(() => {
    supabase
      .from('series')
      .select('id, slug, title, description, created_at, updated_at')
      .order('title')
      .then(({ data }) => {
        if (data) setSeries(data as Series[])
      })
  }, [])

  function handleFilesAccepted(files: File[]) {
    files.forEach(async (file) => {
      const entryId = `${file.name}-${file.size}-${Date.now()}`

      // Add entry immediately so the form appears
      const initialEntry: FileEntry = {
        id: entryId,
        file,
        metadata: {},
        exif: undefined,
        progress: { fileName: file.name, progress: 0, status: 'pending' },
      }
      setEntries((prev) => [...prev, initialEntry])

      // Extract EXIF async and update the entry when ready
      try {
        const exif = await extractExif(file)
        const cropFactor = getCropFactor(exif.cameraMake, exif.cameraModel)

        const captureDate = exif.captureDate
          ? exif.captureDate.toISOString().split('T')[0]
          : undefined

        const exifPreview: ExifPreview = {
          cameraMake: exif.cameraMake,
          cameraModel: exif.cameraModel,
          lensMake: exif.lensMake,
          lensModel: exif.lensModel,
          aperture: exif.aperture != null ? String(exif.aperture) : undefined,
          shutterSpeed: exif.shutterSpeed != null ? String(exif.shutterSpeed) : undefined,
          iso: exif.iso,
          focalLength: exif.focalLengthNative,
          focalLengthEquiv: exif.focalLengthNative != null
            ? Math.round(exif.focalLengthNative * cropFactor)
            : undefined,
          captureDate,
        }

        const prefilled: PhotoMetadata = {
          captureDate,
          cameraOverride: (exif.cameraMake || exif.cameraModel)
            ? { make: exif.cameraMake ?? '', model: exif.cameraModel ?? '' }
            : undefined,
          lensOverride: (exif.lensMake || exif.lensModel)
            ? { make: exif.lensMake ?? '', model: exif.lensModel ?? '' }
            : undefined,
        }

        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, metadata: prefilled, exif: exifPreview } : e
          )
        )
      } catch (err) {
        console.warn('[upload] EXIF extraction failed for', file.name, err)
      }
    })
  }

  function updateMetadata(index: number, meta: PhotoMetadata) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, metadata: meta } : e))
    )
  }

  function retryEntry(index: number) {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === index
          ? { ...e, progress: { fileName: e.file.name, progress: 0, status: 'pending' } }
          : e
      )
    )
  }

  async function handleUploadAll() {
    if (uploading) return
    setUploading(true)

    const pending = entries.filter((e) => e.progress.status !== 'done')

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (entry.progress.status === 'done') continue
      if (!pending.includes(entry)) continue

      try {
        await uploadPhoto(entry.file, entry.metadata, (p) => {
          setEntries((prev) =>
            prev.map((e, idx) => (idx === i ? { ...e, progress: p } : e))
          )
        })
      } catch (err) {
        setEntries((prev) =>
          prev.map((e, idx) =>
            idx === i
              ? {
                  ...e,
                  progress: {
                    fileName: e.file.name,
                    progress: 0,
                    status: 'error',
                    error: err instanceof Error ? err.message : 'Upload failed',
                  },
                }
              : e
          )
        )
      }
    }

    setUploading(false)
  }

  const hasPending = entries.some((e) => e.progress.status !== 'done')
  const allDone = entries.length > 0 && entries.every((e) => e.progress.status === 'done')

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Upload Photos</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Drag and drop or browse to add photos. Fill in metadata before uploading.
          </p>
        </div>

        <UploadZone onFilesAccepted={handleFilesAccepted} />

        {entries.length > 0 && (
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <div key={entry.id}>
                <MetadataForm
                  entry={entry}
                  series={series}
                  onChange={(meta) => updateMetadata(i, meta)}
                />
                {entry.progress.status === 'error' && (
                  <button
                    onClick={() => retryEntry(i)}
                    className="mt-2 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleUploadAll}
                disabled={uploading || !hasPending}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {uploading ? 'Uploading…' : 'Upload All'}
              </button>

              {allDone && (
                <span className="text-green-400 text-sm flex items-center gap-1.5">
                  <CheckCircle size={16} />
                  All photos uploaded
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
