import exifr from 'exifr'

export interface ExifData {
  aperture?: number
  shutterSpeed?: number
  iso?: number
  focalLengthNative?: number
  cameraMake?: string
  cameraModel?: string
  lensMake?: string
  lensModel?: string
  captureDate?: Date
}

/**
 * Format shutter speed as a human-readable fraction (e.g. 0.0015625 → "1/640")
 */
export function formatShutterSpeed(seconds: number): string {
  if (seconds >= 1) return `${seconds}s`
  const denominator = Math.round(1 / seconds)
  return `1/${denominator}`
}

/**
 * Calculate 35mm equivalent focal length.
 */
export function calculateFocalLengthEquiv(nativeMm: number, cropFactor: number): number {
  return nativeMm * cropFactor
}

/**
 * Crop factor lookup table keyed by "make model" (lowercase).
 * Returns 1.0 for full-frame cameras or unknown models.
 */
export const CROP_FACTORS: Record<string, number> = {
  // Fujifilm APS-C (1.5x)
  'fujifilm x-t5': 1.5,
  'fujifilm x-t4': 1.5,
  'fujifilm x-t3': 1.5,
  'fujifilm x-t2': 1.5,
  'fujifilm x-t1': 1.5,
  'fujifilm x-s10': 1.5,
  'fujifilm x-pro3': 1.5,
  'fujifilm x-pro2': 1.5,
  'fujifilm x100v': 1.5,
  // Sony APS-C (1.5x)
  'sony ilce-6700': 1.5,
  'sony ilce-6600': 1.5,
  'sony ilce-6400': 1.5,
  'sony ilce-6300': 1.5,
  'sony ilce-6000': 1.5,
  // Canon APS-C (1.6x)
  'canon eos r7': 1.6,
  'canon eos r10': 1.6,
  'canon eos 90d': 1.6,
  'canon eos rebel sl3': 1.6,
  // Micro Four Thirds (2.0x)
  'olympus om-d e-m1 mark iii': 2.0,
  'olympus om-d e-m5 mark iii': 2.0,
  'panasonic dc-g9': 2.0,
  'panasonic dc-gh6': 2.0,
  // Full frame (1.0x)
  'sony ilce-7m4': 1.0,
  'sony ilce-7rm5': 1.0,
  'sony ilce-7cm2': 1.0,
  'canon eos r5': 1.0,
  'canon eos r6': 1.0,
  'nikon z6': 1.0,
  'nikon z7': 1.0,
}

export function getCropFactor(make?: string, model?: string): number {
  if (!make || !model) return 1.0
  const key = `${make} ${model}`.toLowerCase()
  return CROP_FACTORS[key] ?? 1.0
}

/**
 * Extract EXIF data from a File using exifr.
 */
export async function extractExif(file: File): Promise<ExifData> {
  try {
    const raw = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: false,
      iptc: false,
      xmp: false,
    })

    if (!raw) return {}

    return {
      aperture: raw.FNumber ?? raw.ApertureValue,
      shutterSpeed: raw.ExposureTime ?? raw.ShutterSpeedValue,
      iso: raw.ISO ?? raw.ISOSpeedRatings,
      focalLengthNative: raw.FocalLength,
      cameraMake: typeof raw.Make === 'string' ? raw.Make.trim() : undefined,
      cameraModel: typeof raw.Model === 'string' ? raw.Model.trim() : undefined,
      lensMake: typeof raw.LensMake === 'string' ? raw.LensMake.trim() : undefined,
      lensModel: typeof raw.LensModel === 'string' ? raw.LensModel.trim() : undefined,
      captureDate: raw.DateTimeOriginal ?? raw.DateTime ?? raw.CreateDate,
    }
  } catch {
    // Try bare parse as fallback (no options)
    try {
      const raw = await exifr.parse(file)
      if (!raw) return {}
      return {
        aperture: raw.FNumber,
        shutterSpeed: raw.ExposureTime,
        iso: raw.ISO ?? raw.ISOSpeedRatings,
        focalLengthNative: raw.FocalLength,
        cameraMake: typeof raw.Make === 'string' ? raw.Make.trim() : undefined,
        cameraModel: typeof raw.Model === 'string' ? raw.Model.trim() : undefined,
        lensMake: typeof raw.LensMake === 'string' ? raw.LensMake.trim() : undefined,
        lensModel: typeof raw.LensModel === 'string' ? raw.LensModel.trim() : undefined,
        captureDate: raw.DateTimeOriginal ?? raw.DateTime,
      }
    } catch {
      return {}
    }
  }
}
