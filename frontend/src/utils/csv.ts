import type { DayAheadHour } from '@/types/api'
import { formatLondon } from './format'

type Cell = string | number | null

const escape = (v: Cell) => {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const toCsv = (headers: string[], rows: Cell[][]) =>
  [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n') + '\r\n'

export const HOUR_CSV_HEADERS = [
  'hour_london', 'forecast_published_utc', 'horizon_h', 'forecast_mw', 'bias_adjusted_mw', 'p10_mw', 'p90_mw', 'count_on_mw', 'actual_mw',
]

export const hoursToCsv = (hours: DayAheadHour[]) =>
  toCsv(
    HOUR_CSV_HEADERS,
    hours.map((h) => [
      formatLondon(h.t, 'YYYY-MM-DD HH:mm'),
      h.publish_time,
      h.horizon_h,
      h.forecast,
      h.adjusted,
      h.p10,
      h.p90,
      h.count_on,
      h.actual,
    ]),
  )

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
