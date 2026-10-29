import { useFilterStore } from '@/store/useFilterStore'
import { CUTOFF_OPTIONS } from '@/utils/constants'

export default function CutoffPicker() {
  const cutoff = useFilterStore((s) => s.cutoff)
  const setCutoff = useFilterStore((s) => s.setCutoff)
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <label htmlFor="f-cutoff">Cut-off on D−1</label>
      <select id="f-cutoff" value={cutoff} onChange={(e) => setCutoff(e.target.value)} className="min-h-10 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900">
        {CUTOFF_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  )
}
