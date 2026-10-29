import { create } from 'zustand'
import {
  CUTOFF_OPTIONS,
  DEFAULT_CUTOFF,
  DEFAULT_END,
  DEFAULT_HORIZON,
  DEFAULT_START,
  MAX_HORIZON,
  MAX_RANGE_DAYS,
  RANGE_MAX,
  RANGE_MIN,
} from '@/utils/constants'
import { addDays, diffDays } from '@/utils/format'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

interface FilterState {
  start: string // inclusive, YYYY-MM-DD
  end: string // inclusive, YYYY-MM-DD
  horizon: number
  cutoff: string
  setRange: (start: string, end: string) => void
  setHorizon: (h: number) => void
  setCutoff: (c: string) => void
  hydrate: (raw: Partial<Record<'start' | 'end' | 'h' | 'cutoff', string | null>>) => void
}

export function normalizeRange(start: string, end: string): [string, string] {
  let s = start < RANGE_MIN ? RANGE_MIN : start > RANGE_MAX ? RANGE_MAX : start
  let e = end > RANGE_MAX ? RANGE_MAX : end
  if (e < s) e = s
  // The API caps a request at 45 days; inclusive end dates allow 44 days between them.
  if (diffDays(s, e) > MAX_RANGE_DAYS - 1) e = addDays(s, MAX_RANGE_DAYS - 1)
  if (s > e) s = e
  return [s, e]
}

export const clampHorizon = (h: number) => Math.min(MAX_HORIZON, Math.max(0, Math.round(h)))

export const useFilterStore = create<FilterState>()((set) => ({
  start: DEFAULT_START,
  end: DEFAULT_END,
  horizon: DEFAULT_HORIZON,
  cutoff: DEFAULT_CUTOFF,
  setRange: (start, end) => {
    const [s, e] = normalizeRange(start, end)
    set({ start: s, end: e })
  },
  setHorizon: (h) => set({ horizon: clampHorizon(h) }),
  setCutoff: (c) => set({ cutoff: CUTOFF_OPTIONS.includes(c) ? c : DEFAULT_CUTOFF }),
  hydrate: (raw) =>
    set((st) => {
      const [start, end] = normalizeRange(
        raw.start && DATE_RE.test(raw.start) ? raw.start : st.start,
        raw.end && DATE_RE.test(raw.end) ? raw.end : st.end,
      )
      const h = raw.h != null && raw.h !== '' ? Number(raw.h) : NaN
      return {
        start,
        end,
        horizon: Number.isFinite(h) ? clampHorizon(h) : st.horizon,
        cutoff: raw.cutoff && CUTOFF_OPTIONS.includes(raw.cutoff) ? raw.cutoff : st.cutoff,
      }
    }),
}))
