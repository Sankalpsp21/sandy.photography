import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const MAX_CLAPS = 50

interface UseKudosResult {
  localCount: number
  totalCount: number
  canClap: boolean
  clap: () => Promise<void>
}

export function useKudos(
  itemId: string,
  itemType: 'photo' | 'blog_post',
  initialCount: number
): UseKudosResult {
  const storageKey = `kudos:${itemType}:${itemId}`
  const [localCount, setLocalCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(storageKey) ?? '0', 10) || 0
    } catch {
      return 0
    }
  })
  const [totalCount, setTotalCount] = useState(initialCount)

  // Fetch current total from Supabase on mount
  useEffect(() => {
    async function fetchTotal() {
      const { data } = await supabase
        .from('kudos')
        .select('count')
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single()

      if (data) {
        setTotalCount(data.count as number)
      }
    }

    fetchTotal()
  }, [itemId, itemType])

  const clap = useCallback(async () => {
    if (localCount >= MAX_CLAPS) return

    const newLocalCount = localCount + 1
    const newTotal = totalCount + 1

    // Optimistic update
    setLocalCount(newLocalCount)
    setTotalCount(newTotal)

    try {
      localStorage.setItem(storageKey, String(newLocalCount))
    } catch {
      // localStorage unavailable
    }

    try {
      const { data, error } = await supabase.rpc('increment_kudos', {
        p_item_id: itemId,
        p_item_type: itemType,
      })

      if (error) throw error

      if (typeof data === 'number') {
        setTotalCount(data)
      }
    } catch {
      // Rollback on error
      setLocalCount(localCount)
      setTotalCount(totalCount)
      try {
        localStorage.setItem(storageKey, String(localCount))
      } catch {
        // ignore
      }
    }
  }, [localCount, totalCount, itemId, itemType, storageKey])

  return {
    localCount,
    totalCount,
    canClap: localCount < MAX_CLAPS,
    clap,
  }
}
