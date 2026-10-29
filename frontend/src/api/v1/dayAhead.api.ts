import type { DayAheadParams, DayAheadResponse } from '@/types/api'
import { get } from './http'

export const getDayAhead = (p: DayAheadParams, signal?: AbortSignal) =>
  get<DayAheadResponse>(`/day-ahead/${p.date}`, { cutoff: p.cutoff }, signal)
