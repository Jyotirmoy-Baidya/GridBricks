import type { DayAheadHour } from '@/types/api'

export type WindSource = 'forecast' | 'adjusted' | 'countOn' | 'actual'

const pick = (h: DayAheadHour, source: WindSource) =>
  source === 'forecast' ? h.forecast : source === 'adjusted' ? h.adjusted : source === 'countOn' ? h.count_on : h.actual

/** Total wind energy over the day in GWh, or null when any hour has no figure. */
export function windGwh(hours: DayAheadHour[], source: WindSource): number | null {
  if (hours.length === 0) return null
  let mwh = 0
  for (const h of hours) {
    const wind = pick(h, source)
    if (wind == null) return null
    mwh += wind
  }
  return mwh / 1000
}

/**
 * Power still to buy over the day, in GWh, if demand is a flat `demandMw` and wind delivers what
 * `source` says. Each hour counts only its shortfall (demand above wind); surplus wind earns nothing
 * here. Returns null when any hour has no wind figure, so a partial day is never presented as a total.
 */
export function additionalGwh(hours: DayAheadHour[], demandMw: number, source: WindSource): number | null {
  if (hours.length === 0) return null
  let mwh = 0
  for (const h of hours) {
    const wind = pick(h, source)
    if (wind == null) return null
    mwh += Math.max(0, demandMw - wind)
  }
  return mwh / 1000
}
