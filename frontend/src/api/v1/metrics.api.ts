import type {
  ByHorizonResponse,
  ByHourResponse,
  DistributionResponse,
  HorizonParams,
  RangeParams,
  SummaryMetrics,
} from '@/types/api'
import { get } from './http'

const withHorizon = (p: HorizonParams) => ({ start: p.start, end: p.end, horizon_h: p.horizon })

export const getSummary = (p: HorizonParams, signal?: AbortSignal) =>
  get<SummaryMetrics>('/metrics/summary', withHorizon(p), signal)

export const getByHorizon = (p: RangeParams, signal?: AbortSignal) =>
  get<ByHorizonResponse>('/metrics/by-horizon', { start: p.start, end: p.end, max_h: 48 }, signal)

export const getByHour = (p: HorizonParams, signal?: AbortSignal) =>
  get<ByHourResponse>('/metrics/by-hour', withHorizon(p), signal)

export const getDistribution = (p: HorizonParams, signal?: AbortSignal) =>
  get<DistributionResponse>('/metrics/distribution', { ...withHorizon(p), bins: 24 }, signal)
