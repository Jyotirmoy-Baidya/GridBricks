import { describe, expect, it } from 'vitest'
import type { DayAheadHour } from '@/types/api'
import { additionalGwh, windGwh } from './procurement'

const hour = (forecast: number | null, adjusted: number | null, count_on: number | null): DayAheadHour => ({
  t: '2026-01-01T00:00:00Z', horizon_h: 4, forecast, publish_time: null, adjusted, p10: null, p90: null, count_on, actual: null,
})

describe('additionalGwh', () => {
  const hours = [hour(10000, 8000, 6000), hour(30000, 28000, 25000)]

  it('buys only the shortfall in each hour', () => {
    // demand 20,000 MW: hour 1 is short 10,000; hour 2 has surplus wind, so 0 to buy
    expect(additionalGwh(hours, 20000, 'forecast')).toBe(10)
  })

  it('buys more when wind is assumed lower', () => {
    expect(additionalGwh(hours, 20000, 'adjusted')).toBe(12)
    expect(additionalGwh(hours, 20000, 'countOn')).toBe(14)
  })

  it('totals wind energy and supports checking against what really happened', () => {
    expect(windGwh(hours, 'forecast')).toBe(40)
    const known = hours.map((h, i) => ({ ...h, actual: [9000, 31000][i] }))
    expect(windGwh(known, 'actual')).toBe(40)
    expect(additionalGwh(known, 20000, 'actual')).toBe(11)
    expect(windGwh(hours, 'actual')).toBeNull() // actual not known yet
  })

  it('refuses to total a day with a missing hour', () => {
    expect(additionalGwh([...hours, hour(null, null, null)], 20000, 'forecast')).toBeNull()
    expect(additionalGwh([], 20000, 'forecast')).toBeNull()
  })
})
