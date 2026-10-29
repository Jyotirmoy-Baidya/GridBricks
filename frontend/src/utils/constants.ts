// Used until the API reports what data is loaded (and if it cannot be reached).
export const FALLBACK_BOUNDS = { min: '2025-12-30', max: '2026-01-31' }

export const DEFAULT_SPAN_DAYS = 31
export const DEFAULT_HORIZON = 4
export const DEFAULT_CUTOFF = '09:00'

export const MAX_RANGE_DAYS = 45
export const MAX_HORIZON = 48
export const CUTOFF_OPTIONS = ['07:00', '09:00', '11:00']

// Day-ahead decisions on D-1 cover roughly this horizon span for a 09:00 cut-off.
export const DAY_AHEAD_HORIZON = [15, 39] as const
