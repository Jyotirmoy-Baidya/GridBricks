import type { Coverage } from '@/types/api'
import { get } from './http'

export const getCoverage = (signal?: AbortSignal) => get<Coverage>('/meta/coverage', {}, signal)
