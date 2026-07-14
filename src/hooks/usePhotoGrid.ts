import { useState, useEffect, useRef, useCallback } from 'react'
import type { Photo } from '../types'

/**
 * Returns the number of columns based on container width.
 */
export function useColumnCount(width: number): number {
  if (width < 640) return 1
  return 3
}

/**
 * Distributes photos into columns using a shortest-column-first algorithm.
 * Returns columns as Photo[][] and a ref to attach to the container element.
 */
export function usePhotoGrid(photos: Photo[]): {
  columns: Photo[][]
  containerRef: React.RefObject<HTMLDivElement | null>
} {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(() => {
    // Default to window width so the initial render is correct on mobile
    return typeof window !== 'undefined' ? window.innerWidth : 1280
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(el)
    // Set initial width
    setContainerWidth(el.getBoundingClientRect().width)

    return () => observer.disconnect()
  }, [])

  const buildColumns = useCallback(
    (photos: Photo[], numCols: number): Photo[][] => {
      const cols: Photo[][] = Array.from({ length: numCols }, () => [])
      const heights: number[] = new Array(numCols).fill(0)

      for (const photo of photos) {
        // Find the shortest column
        let shortestIdx = 0
        for (let i = 1; i < numCols; i++) {
          if (heights[i] < heights[shortestIdx]) {
            shortestIdx = i
          }
        }
        cols[shortestIdx].push(photo)
        // Track relative height using aspect ratio (height/width)
        heights[shortestIdx] += photo.height / photo.width
      }

      return cols
    },
    []
  )

  const numCols = useColumnCount(containerWidth)
  const columns = buildColumns(photos, numCols)

  return { columns, containerRef }
}
