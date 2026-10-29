import type { Coverage } from '@/types/api'
import { addDays } from './format'

export interface Bounds {
  min: string // first date with actual data, YYYY-MM-DD
  max: string // last date with a complete day of actual data
}

/** Date limits for the pickers, taken from what the database holds (UTC dates). */
export function boundsFromCoverage(c: Coverage): Bounds | null {
  if (!c.loaded || !c.actual_start || !c.actual_end) return null
  const last = c.actual_end.slice(0, 10)
  const hour = Number(c.actual_end.slice(11, 13))
  // A partly reported final day would show gaps, so stop at the last full day.
  return { min: c.actual_start.slice(0, 10), max: hour >= 23 ? last : addDays(last, -1) }
}
