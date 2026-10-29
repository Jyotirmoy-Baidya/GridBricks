interface Props {
  label: string
  achieved: number | null // 0..1
  target: number // 0..1
  note: string
}

/** A bar for the achieved share, with a marker at the target. */
export default function TargetBar({ label, achieved, target, note }: Props) {
  const pct = (v: number) => `${(v * 100).toFixed(0)}%`
  const gap = achieved == null ? null : achieved - target
  const verdict = gap == null ? '' : gap >= -0.03 ? 'On target' : gap >= -0.1 ? 'A little short' : 'Well short'
  const tone = gap == null ? 'bg-slate-300' : gap >= -0.03 ? 'bg-wind' : gap >= -0.1 ? 'bg-fc' : 'bg-red-400'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-sm text-slate-600">
          <strong className="text-slate-900">{achieved == null ? '–' : pct(achieved)}</strong> against a target of {pct(target)}
          {verdict && <> · {verdict}</>}
        </span>
      </div>
      <div className="relative h-3 rounded bg-slate-100" role="img" aria-label={`${label}: ${achieved == null ? 'no value' : pct(achieved)}, target ${pct(target)}`}>
        {achieved != null && <div className={`h-full rounded ${tone}`} style={{ width: `${Math.min(100, achieved * 100)}%` }} />}
        <div className="absolute -top-1 h-5 w-0.5 bg-slate-900" style={{ left: `${target * 100}%` }} title={`Target ${pct(target)}`} />
      </div>
      <p className="m-0 text-[12.5px] text-slate-600">{note}</p>
    </div>
  )
}
