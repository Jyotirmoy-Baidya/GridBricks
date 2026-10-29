import { describe, expect, it } from 'vitest'
import type { DayAheadHour } from '@/types/api'
import { hoursToCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('quotes commas, quotes and newlines, and leaves nulls empty', () => {
    expect(toCsv(['a', 'b'], [['x,y', 'say "hi"'], [null, 3]])).toBe('a,b\r\n"x,y","say ""hi"""\r\n,3\r\n')
  })
})

describe('hoursToCsv', () => {
  it('writes London time, one row per hour and empty cells for gaps', () => {
    const h: DayAheadHour = {
      t: '2026-07-15T23:00:00Z', horizon_h: 15.5, forecast: 1200, publish_time: '2026-07-15T07:30:00Z',
      adjusted: 1000, p10: 900, p90: 1300, count_on: 800, actual: null,
    }
    const lines = hoursToCsv([h]).trim().split('\r\n')
    expect(lines[0]).toContain('hour_london')
    expect(lines[1]).toBe('2026-07-16 00:00,2026-07-15T07:30:00Z,15.5,1200,1000,900,1300,800,')
  })
})
