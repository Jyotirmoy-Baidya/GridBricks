import { describe, expect, it } from 'vitest'
import type { Coverage } from '@/types/api'
import { boundsFromCoverage } from './bounds'

const base: Coverage = {
  loaded: true,
  ingested_at: null,
  actual_rows: 1,
  forecast_rows: 1,
  actual_start: '2025-12-30T00:00:00Z',
  actual_end: '2026-02-01T23:30:00Z',
  target_start: null,
  target_end: null,
}

describe('boundsFromCoverage', () => {
  it('uses the last day when it is complete', () => {
    expect(boundsFromCoverage(base)).toEqual({ min: '2025-12-30', max: '2026-02-01' })
  })
  it('drops a partly reported final day', () => {
    expect(boundsFromCoverage({ ...base, actual_end: '2026-10-29T08:00:00Z' })?.max).toBe('2026-10-28')
  })
  it('returns null when nothing is loaded', () => {
    expect(boundsFromCoverage({ ...base, loaded: false })).toBeNull()
  })
})
