import { useMemo } from 'react'
import { useFilterStore } from '@/store/useFilterStore'
import type { HorizonParams } from '@/types/api'
import { addDays, startOfDayUtc } from '@/utils/format'
import { useDebouncedValue } from './useDebouncedValue'

/** API params for the selected range. The UI end date is inclusive; the API end is exclusive. */
export function useQueryParams(): HorizonParams {
  const start = useFilterStore((s) => s.start)
  const end = useFilterStore((s) => s.end)
  const horizon = useDebouncedValue(
    useFilterStore((s) => s.horizon),
    250,
  )
  return useMemo(
    () => ({ start: startOfDayUtc(start), end: startOfDayUtc(addDays(end, 1)), horizon }),
    [start, end, horizon],
  )
}
