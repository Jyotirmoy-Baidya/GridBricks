import { useFilterStore } from '@/store/useFilterStore'
import { MAX_HORIZON } from '@/utils/constants'

export default function HorizonSlider() {
  const horizon = useFilterStore((s) => s.horizon)
  const setHorizon = useFilterStore((s) => s.setHorizon)
  return (
    <div className="flex items-center gap-2.5 text-sm text-slate-600">
      <label htmlFor="f-horizon">Horizon</label>
      <input id="f-horizon" type="range" min={0} max={MAX_HORIZON} step={1} value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="w-36" />
      <span className="min-w-11 font-mono font-semibold text-slate-900">{horizon} h</span>
    </div>
  )
}
