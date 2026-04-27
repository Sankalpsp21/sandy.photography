import { useRef, useState, useCallback } from 'react'
import { Upload } from 'lucide-react'

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  // RAW formats
  'image/x-raw',
  'image/x-canon-cr2',
  'image/x-canon-cr3',
  'image/x-nikon-nef',
  'image/x-sony-arw',
  'image/x-adobe-dng',
  'image/x-olympus-orf',
  'image/x-panasonic-rw2',
])

const ACCEPTED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp',
  '.raw', '.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2',
])

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

function formatMB(bytes: number): number {
  return Math.round(bytes / (1024 * 1024))
}

function isAcceptedFile(file: File): boolean {
  // Check MIME type first
  if (ACCEPTED_MIME_TYPES.has(file.type)) return true
  // Fall back to extension check (HEIC/RAW often have empty MIME)
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  return ACCEPTED_EXTENSIONS.has(ext)
}

interface FileError {
  fileName: string
  message: string
}

interface UploadZoneProps {
  onFilesAccepted: (files: File[]) => void
}

export default function UploadZone({ onFilesAccepted }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<FileError[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    (files: File[]) => {
      const valid: File[] = []
      const newErrors: FileError[] = []

      for (const file of files) {
        if (file.size > MAX_SIZE_BYTES) {
          newErrors.push({
            fileName: file.name,
            message: `${file.name}: File too large (${formatMB(file.size)} MB). Maximum is 50 MB.`,
          })
        } else if (!isAcceptedFile(file)) {
          newErrors.push({
            fileName: file.name,
            message: `${file.name}: Unsupported format. Accepted: JPEG, PNG, HEIC, WebP, RAW.`,
          })
        } else {
          valid.push(file)
        }
      }

      setErrors(newErrors)
      if (valid.length > 0) {
        onFilesAccepted(valid)
      }
    },
    [onFilesAccepted]
  )

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    processFiles(files)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const hasErrors = errors.length > 0

  const borderClass = isDragOver
    ? 'border-blue-400 bg-blue-500/10'
    : hasErrors
      ? 'border-red-500/60 bg-red-500/5'
      : 'border-neutral-600 hover:border-neutral-400 bg-neutral-900/50'

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${borderClass}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photos — drag and drop or click to browse"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <Upload
          size={36}
          className={isDragOver ? 'text-blue-400' : 'text-neutral-400'}
        />
        <div className="text-center">
          <p className="text-white font-medium">
            {isDragOver ? 'Drop files here' : 'Drag & drop photos here'}
          </p>
          <p className="text-neutral-400 text-sm mt-1">or click to browse</p>
        </div>
        <p className="text-neutral-500 text-xs text-center">
          JPEG, PNG, HEIC, WebP, RAW · Max 50 MB per file
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.heic,.heif,.webp,.raw,.cr2,.cr3,.nef,.arw,.dng,.orf,.rw2"
          className="hidden"
          onChange={handleInputChange}
          aria-hidden="true"
        />
      </div>

      {hasErrors && (
        <ul className="mt-3 space-y-1">
          {errors.map((err) => (
            <li key={err.fileName} className="text-red-400 text-sm">
              {err.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
