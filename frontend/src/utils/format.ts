import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'Europe/London'
const DASH = '–'

type Num = number | null | undefined

export const formatInt = (n: Num) => (n == null ? DASH : Math.round(n).toLocaleString('en-GB'))

export const formatSigned = (n: Num) => {
  if (n == null) return DASH
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${Math.abs(Math.round(n)).toLocaleString('en-GB')}`
}

export const formatPct = (fraction: Num, dp = 1) =>
  fraction == null ? DASH : `${(fraction * 100).toFixed(dp)}%`

export const formatGw = (mw: number) => `${(mw / 1000).toFixed(0)} GW`

export const formatLondon = (iso: string | number, fmt = 'D MMM HH:mm') =>
  dayjs(iso).tz(TZ).format(fmt)

export const addDays = (date: string, n: number) => dayjs.utc(date).add(n, 'day').format('YYYY-MM-DD')

export const diffDays = (from: string, to: string) => dayjs.utc(to).diff(dayjs.utc(from), 'day')

export const startOfDayUtc = (date: string) => `${date}T00:00:00Z`
