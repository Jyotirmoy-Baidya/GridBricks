export const DEFAULT_START = '2026-01-01'
export const DEFAULT_END = '2026-01-31'
export const DEFAULT_HORIZON = 4
export const DEFAULT_CUTOFF = '09:00'
export const DEFAULT_DELIVERY = '2026-01-15'

export const RANGE_MIN = '2026-01-01'
export const RANGE_MAX = '2026-01-31'
export const DELIVERY_MIN = '2026-01-02'
export const DELIVERY_MAX = '2026-02-01'

export const MAX_RANGE_DAYS = 45
export const MAX_HORIZON = 48
export const CUTOFF_OPTIONS = ['07:00', '09:00', '11:00']

// Day-ahead decisions on D-1 cover roughly this horizon span for a 09:00 cut-off.
export const DAY_AHEAD_HORIZON = [15, 39] as const
