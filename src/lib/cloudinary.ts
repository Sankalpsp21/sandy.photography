const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string

const BASE = `https://res.cloudinary.com/${cloudName}/image/upload`

export interface CloudinaryOptions {
  width?: number
  dpr?: number
}

/**
 * Responsive delivery URL: f_auto,q_auto,w_{width},dpr_{dpr}
 */
export function cloudinaryUrl(publicId: string, options: CloudinaryOptions = {}): string {
  const { width = 800, dpr = 1 } = options
  return `${BASE}/f_auto,q_auto,w_${width},dpr_${dpr}/${publicId}`
}

/**
 * Blur placeholder URL: f_auto,q_1,w_40,e_blur:1000
 */
export function cloudinaryBlurUrl(publicId: string): string {
  return `${BASE}/f_auto,q_1,w_40,e_blur:1000/${publicId}`
}

/**
 * Full resolution URL: f_auto,q_auto
 */
export function cloudinaryFullResUrl(publicId: string): string {
  return `${BASE}/f_auto,q_auto/${publicId}`
}

/**
 * Original download URL: fl_attachment
 */
export function cloudinaryDownloadUrl(publicId: string): string {
  return `${BASE}/fl_attachment/${publicId}`
}
