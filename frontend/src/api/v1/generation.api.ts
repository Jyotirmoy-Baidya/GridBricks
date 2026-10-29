import type { ComparisonResponse, HorizonParams } from '@/types/api'
import { get } from './http'

export const getComparison = (p: HorizonParams, signal?: AbortSignal) =>
  get<ComparisonResponse>(
    '/generation/comparison',
    { start: p.start, end: p.end, horizon_h: p.horizon },
    signal,
  )
