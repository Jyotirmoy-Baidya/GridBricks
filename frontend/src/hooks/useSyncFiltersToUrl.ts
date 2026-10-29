import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFilterStore } from '@/store/useFilterStore'

/** Filters live in the store; the URL query mirrors them so any view can be shared. */
export function useSyncFiltersToUrl() {
  const [params, setParams] = useSearchParams()
  // Hydrate synchronously during the first render, before any effect writes defaults to the URL.
  useState(() => {
    useFilterStore.getState().hydrate({
      start: params.get('start'),
      end: params.get('end'),
      h: params.get('h'),
      cutoff: params.get('cutoff'),
    })
    return null
  })
  const { start, end, horizon, cutoff } = useFilterStore()

  useEffect(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('start', start)
        next.set('end', end)
        next.set('h', String(horizon))
        next.set('cutoff', cutoff)
        return next.toString() === prev.toString() ? prev : next
      },
      { replace: true },
    )
  }, [start, end, horizon, cutoff, setParams])
}
