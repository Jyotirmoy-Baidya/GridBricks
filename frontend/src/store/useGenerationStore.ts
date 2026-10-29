import { getComparison } from '@/api/v1/generation.api'
import { getCoverage } from '@/api/v1/meta.api'
import { createResourceStore } from './resource'

export const useComparisonStore = createResourceStore('comparison', getComparison)
export const useCoverageStore = createResourceStore<void, Awaited<ReturnType<typeof getCoverage>>>(
  'coverage',
  (_p, signal) => getCoverage(signal),
)
