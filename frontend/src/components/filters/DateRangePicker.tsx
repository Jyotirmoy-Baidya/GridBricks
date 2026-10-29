import { useFilterStore } from '@/store/useFilterStore'
import { RANGE_MAX, RANGE_MIN } from '@/utils/constants'

const INPUT = 'min-h-10 rounded-md border border-slate-300 bg-white px-2 text-sm'

export default function DateRangePicker() {
  const start = useFilterStore((s) => s.start)
  const end = useFilterStore((s) => s.end)
  const setRange = useFilterStore((s) => s.setRange)
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <label htmlFor="f-start">From</label>
      <input id="f-start" type="date" className={INPUT} min={RANGE_MIN} max={RANGE_MAX} value={start} onChange={(e) => e.target.value && setRange(e.target.value, end)} />
      <label htmlFor="f-end">to</label>
      <input id="f-end" type="date" className={INPUT} min={RANGE_MIN} max={RANGE_MAX} value={end} onChange={(e) => e.target.value && setRange(start, e.target.value)} />
    </div>
  )
}
