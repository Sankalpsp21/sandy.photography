import { useCallback } from 'react'

interface ShareParams {
  title: string
  url: string
  text?: string
}

interface UseShareResult {
  share: () => Promise<void>
  canUseNativeShare: boolean
}

export function useShare({ title, url, text }: ShareParams): UseShareResult {
  const canUseNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  const share = useCallback(async () => {
    if (canUseNativeShare) {
      try {
        await navigator.share({ title, url, text })
      } catch (err) {
        // User cancelled or error — ignore
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
    // If no native share, the component handles the fallback UI
  }, [canUseNativeShare, title, url, text])

  return { share, canUseNativeShare }
}
