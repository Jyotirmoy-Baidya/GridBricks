// Mirrors backend/app/schemas. Timestamps are ISO-8601 UTC strings.

export interface Coverage {
  loaded: boolean
  ingested_at: string | null
  actual_rows: number
  forecast_rows: number
  actual_start: string | null
  actual_end: string | null
  target_start: string | null
  target_end: string | null
}

export interface ComparisonPoint {
  t: string
  actual: number
  forecast: number | null
  publish_time: string | null
  error: number | null // forecast - actual
}

export interface ComparisonResponse {
  horizon_h: number
  points: ComparisonPoint[]
}

export interface SummaryMetrics {
  n: number
  hours: number
  coverage: number
  mae: number | null
  rmse: number | null
  bias: number | null
  nmae: number | null
  p50_abs: number | null
  p90_abs: number | null
  p99_abs: number | null
  over_p90: number | null
  correlation: number | null
}

export interface HorizonMetrics extends SummaryMetrics {
  horizon_h: number
}

export interface ByHorizonResponse {
  rows: HorizonMetrics[]
}

export interface HourOfDayMetrics {
  hour: number
  n: number
  mae: number
  bias: number
}

export interface ByHourResponse {
  horizon_h: number
  rows: HourOfDayMetrics[]
}

export interface WorstMiss {
  t: string
  publish_time: string
  forecast: number
  actual: number
  error: number
}

export interface DistributionResponse {
  horizon_h: number
  bin_edges: number[]
  counts: number[]
  worst: WorstMiss[]
}

export interface DayAheadHour {
  t: string
  horizon_h: number
  forecast: number | null
  publish_time: string | null
  p10: number | null
  p90: number | null
  count_on: number | null
  actual: number | null
}

export interface DayAheadResponse {
  delivery_date: string
  cutoff: string
  forecast_gwh: number | null
  count_on_gwh: number | null
  actual_gwh: number | null
  hours: DayAheadHour[]
}

export interface RangeParams {
  start: string // ISO UTC, inclusive
  end: string // ISO UTC, exclusive
}

export interface HorizonParams extends RangeParams {
  horizon: number
}

export interface DayAheadParams {
  date: string
  cutoff: string
}
