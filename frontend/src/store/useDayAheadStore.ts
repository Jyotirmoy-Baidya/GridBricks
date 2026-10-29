import { getDayAhead } from '@/api/v1/dayAhead.api'
import { createResourceStore } from './resource'

export const useDayAheadStore = createResourceStore('day-ahead', getDayAhead)
