import { supabase } from './supabase'
import { extractExif, getCropFactor, calculateFocalLengthEquiv } from './exif'
import type { Photo } from '../types'

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export interface PhotoMetadata {
  title?: string
  description?: string
  captureDate?: string
  tags?: string[]
  seriesId?: string
  cameraOverride?: { make: string; model: string }
  lensOverride?: { make: string; model: string }
}

interface SignResponse {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
}

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
}

function getSupabaseFunctionsUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  return `${supabaseUrl}/functions/v1`
}

async function getSignature(folder?: string): Promise<SignResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token

  const res = await fetch(`${getSupabaseFunctionsUrl()}/sign-cloudinary-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ folder }),
  })

  if (!res.ok) {
    throw new Error(`Failed to get upload signature: ${res.statusText}`)
  }

  return res.json() as Promise<SignResponse>
}

function uploadToCloudinary(
  file: File,
  sign: SignResponse,
  onProgress: (percent: number) => void
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', sign.apiKey)
    formData.append('timestamp', String(sign.timestamp))
    formData.append('signature', sign.signature)
    formData.append('folder', sign.folder)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResponse)
        } catch {
          reject(new Error('Invalid Cloudinary response'))
        }
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}

export async function uploadPhoto(
  file: File,
  metadata: PhotoMetadata,
  onProgress: (p: UploadProgress) => void
): Promise<Photo> {
  const fileName = file.name

  onProgress({ fileName, progress: 0, status: 'pending' })

  // Step 1: Extract EXIF
  const exif = await extractExif(file)

  // Step 2: Calculate focal length equivalent
  const cameraMake = metadata.cameraOverride?.make ?? exif.cameraMake
  const cameraModel = metadata.cameraOverride?.model ?? exif.cameraModel
  const cropFactor = getCropFactor(cameraMake, cameraModel)
  const focalLengthEquiv =
    exif.focalLengthNative != null
      ? calculateFocalLengthEquiv(exif.focalLengthNative, cropFactor)
      : undefined

  // Step 3: Get signed upload params from Edge Function
  onProgress({ fileName, progress: 5, status: 'uploading' })
  const sign = await getSignature(metadata.seriesId ? `sandy-photography` : undefined)

  // Step 4: Upload to Cloudinary with progress tracking
  const cloudinaryResult = await uploadToCloudinary(file, sign, (percent) => {
    onProgress({ fileName, progress: 5 + Math.round(percent * 0.85), status: 'uploading' })
  })

  onProgress({ fileName, progress: 92, status: 'uploading' })

  // Step 5: INSERT photo row into Supabase
  const captureDate =
    metadata.captureDate ??
    (exif.captureDate ? exif.captureDate.toISOString() : undefined)

  const aperture = exif.aperture != null ? `${exif.aperture}` : undefined
  const shutterSpeed = exif.shutterSpeed != null ? `${exif.shutterSpeed}` : undefined

  const photoRow = {
    cloudinary_id: cloudinaryResult.public_id,
    secure_url: cloudinaryResult.secure_url,
    width: cloudinaryResult.width,
    height: cloudinaryResult.height,
    title: metadata.title ?? null,
    description: metadata.description ?? null,
    tags: metadata.tags ?? [],
    capture_date: captureDate ?? null,
    // Camera — manual override takes precedence
    camera_make: metadata.cameraOverride?.make ?? exif.cameraMake ?? null,
    camera_model: metadata.cameraOverride?.model ?? exif.cameraModel ?? null,
    lens_make: metadata.lensOverride?.make ?? exif.lensMake ?? null,
    lens_model: metadata.lensOverride?.model ?? exif.lensModel ?? null,
    aperture: aperture ?? null,
    shutter_speed: shutterSpeed ?? null,
    iso: exif.iso ?? null,
    focal_length_native: exif.focalLengthNative ?? null,
    focal_length_equiv: focalLengthEquiv ?? null,
    sensor_crop_factor: cropFactor !== 1.0 ? cropFactor : null,
    camera_overridden: !!metadata.cameraOverride,
    lens_overridden: !!metadata.lensOverride,
  }

  const { data, error } = await supabase
    .from('photos')
    .insert(photoRow)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save photo: ${error.message}`)
  }

  // If a series was specified, add to series_photos
  if (metadata.seriesId && data) {
    // Get current max position in series
    const { data: existing } = await supabase
      .from('series_photos')
      .select('position')
      .eq('series_id', metadata.seriesId)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

    await supabase.from('series_photos').insert({
      series_id: metadata.seriesId,
      photo_id: data.id,
      position: nextPosition,
    })
  }

  onProgress({ fileName, progress: 100, status: 'done' })

  return data as Photo
}
