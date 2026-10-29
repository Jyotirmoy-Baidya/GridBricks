import { getLive } from '@/api/v1/live.api'
import type { LiveResponse } from '@/types/api'
import { createResourceStore } from './resource'

export const useLiveStore = createResourceStore<void, LiveResponse>('live', (_p, signal) => getLive(signal))
