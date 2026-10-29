import type { LiveResponse } from '@/types/api'
import { get } from './http'

export const getLive = (signal?: AbortSignal) => get<LiveResponse>('/live/day-ahead', {}, signal)
