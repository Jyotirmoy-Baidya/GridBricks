import { getByHorizon, getByHour, getCalibration, getDistribution, getSummary } from '@/api/v1/metrics.api'
import { createResourceStore } from './resource'

export const useSummaryStore = createResourceStore('summary', getSummary)
export const useByHorizonStore = createResourceStore('by-horizon', getByHorizon)
export const useByHourStore = createResourceStore('by-hour', getByHour)
export const useDistributionStore = createResourceStore('distribution', getDistribution)
export const useCalibrationStore = createResourceStore('calibration', getCalibration)
