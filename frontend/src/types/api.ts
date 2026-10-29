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

/** recent: learned from the 30 days before the day; all_history: in-sample (too little earlier data) */
export type BandsBasis = 'recent' | 'all_history'

export interface DayAheadHour {
  t: string
  horizon_h: number
  forecast: number | null
  publish_time: string | null
  adjusted: number | null
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
  bands_basis: BandsBasis | null
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

export interface LiveResponse {
  delivery_date: string
  as_of: string | null
  fetched_at: string
  forecast_gwh: number | null
  count_on_gwh: number | null
  bands_basis: BandsBasis | null
  hours: DayAheadHour[]
}

export interface CalibrationParams extends HorizonParams {
  trainDays: number
}

export interface Calibration {
  horizon_h: number
  enough_training: boolean
  n_train: number
  n_test: number
  train_start: string
  train_end: string
  test_start: string
  test_end: string
  q10: number | null
  q90: number | null
  train_bias: number | null
  test_bias: number | null
  band_target: number
  band_coverage: number | null
  band_coverage_in_sample: number | null
  count_on_target: number
  count_on_hit_rate: number | null
  mae_raw: number | null
  mae_adjusted: number | null
  rmse_raw: number | null
  rmse_adjusted: number | null
}
