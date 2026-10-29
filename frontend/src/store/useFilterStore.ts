import { create } from 'zustand'
import type { Bounds } from '@/utils/bounds'
import {
  CUTOFF_OPTIONS,
  DEFAULT_CUTOFF,
  DEFAULT_HORIZON,
  DEFAULT_SPAN_DAYS,
  FALLBACK_BOUNDS,
  MAX_HORIZON,
  MAX_RANGE_DAYS,
} from '@/utils/constants'
import { addDays, diffDays } from '@/utils/format'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

interface FilterState {
  start: string // inclusive, YYYY-MM-DD
  end: string // inclusive, YYYY-MM-DD
  horizon: number
  cutoff: string
  bounds: Bounds // limits of the loaded data
  userSet: boolean // true once the range came from the URL or the user
  setBounds: (b: Bounds) => void
  setRange: (start: string, end: string) => void
  setHorizon: (h: number) => void
  setCutoff: (c: string) => void
  hydrate: (raw: Partial<Record<'start' | 'end' | 'h' | 'cutoff', string | null>>) => void
}

export function normalizeRange(start: string, end: string, bounds: Bounds): [string, string] {
  let s = start < bounds.min ? bounds.min : start > bounds.max ? bounds.max : start
  let e = end > bounds.max ? bounds.max : end
  if (e < s) e = s
  // The API caps a request at 45 days; inclusive end dates allow 44 days between them.
  if (diffDays(s, e) > MAX_RANGE_DAYS - 1) e = addDays(s, MAX_RANGE_DAYS - 1)
  if (s > e) s = e
  return [s, e]
}

export const clampHorizon = (h: number) => Math.min(MAX_HORIZON, Math.max(0, Math.round(h)))

/** By default show the most recent month of loaded data. */
export function latestRange(b: Bounds): [string, string] {
  const start = addDays(b.max, -(DEFAULT_SPAN_DAYS - 1))
  return [start < b.min ? b.min : start, b.max]
}

const [initStart, initEnd] = latestRange(FALLBACK_BOUNDS)

export const useFilterStore = create<FilterState>()((set) => ({
  start: initStart,
  end: initEnd,
  horizon: DEFAULT_HORIZON,
  cutoff: DEFAULT_CUTOFF,
  bounds: FALLBACK_BOUNDS,
  userSet: false,
  setBounds: (bounds) =>
    set((st) => {
      if (!st.userSet) {
        const [start, end] = latestRange(bounds)
        return { bounds, start, end }
      }
      const [start, end] = normalizeRange(st.start, st.end, bounds)
      return { bounds, start, end }
    }),
  setRange: (start, end) =>
    set((st) => {
      const [s, e] = normalizeRange(start, end, st.bounds)
      return { start: s, end: e, userSet: true }
    }),
  setHorizon: (h) => set({ horizon: clampHorizon(h) }),
  setCutoff: (c) => set({ cutoff: CUTOFF_OPTIONS.includes(c) ? c : DEFAULT_CUTOFF }),
  hydrate: (raw) =>
    set((st) => {
      const fromUrl = Boolean((raw.start && DATE_RE.test(raw.start)) || (raw.end && DATE_RE.test(raw.end)))
      const [start, end] = normalizeRange(
        raw.start && DATE_RE.test(raw.start) ? raw.start : st.start,
        raw.end && DATE_RE.test(raw.end) ? raw.end : st.end,
        st.bounds,
      )
      const h = raw.h != null && raw.h !== '' ? Number(raw.h) : NaN
      return {
        start,
        end,
        userSet: st.userSet || fromUrl,
        horizon: Number.isFinite(h) ? clampHorizon(h) : st.horizon,
        cutoff: raw.cutoff && CUTOFF_OPTIONS.includes(raw.cutoff) ? raw.cutoff : st.cutoff,
      }
    }),
}))
