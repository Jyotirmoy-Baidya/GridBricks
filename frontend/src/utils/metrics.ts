export type HorizonMetricKey = 'mae' | 'rmse' | 'p90_abs'

export const METRIC_LABEL: Record<HorizonMetricKey, string> = {
  mae: 'MAE',
  rmse: 'RMSE',
  p90_abs: 'P90 |error|',
}
