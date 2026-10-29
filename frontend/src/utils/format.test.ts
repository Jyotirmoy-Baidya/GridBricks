import { describe, expect, it } from 'vitest'
import { addDays, diffDays, formatInt, formatLondon, formatPct, formatSigned } from './format'

describe('format', () => {
  it('formats numbers and handles null', () => {
    expect(formatInt(1836.4)).toBe('1,836')
    expect(formatInt(null)).toBe('–')
    expect(formatSigned(-1645)).toBe('−1,645')
    expect(formatSigned(10)).toBe('+10')
    expect(formatPct(0.1234)).toBe('12.3%')
  })

  it('does date arithmetic in UTC', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(diffDays('2026-01-01', '2026-01-31')).toBe(30)
  })

  it('shows Europe/London local time', () => {
    expect(formatLondon('2026-01-15T12:00:00Z', 'HH:mm')).toBe('12:00')
    expect(formatLondon('2026-07-15T12:00:00Z', 'HH:mm')).toBe('13:00')
  })
})
