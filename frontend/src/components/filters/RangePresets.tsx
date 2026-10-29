import { latestRange, useFilterStore } from '@/store/useFilterStore'

const STUDY: [string, string] = ['2026-01-01', '2026-01-31']

export default function RangePresets() {
  const start = useFilterStore((s) => s.start)
  const end = useFilterStore((s) => s.end)
  const bounds = useFilterStore((s) => s.bounds)
  const setRange = useFilterStore((s) => s.setRange)

  const presets: { label: string; title: string; range: [string, string]; available: boolean }[] = [
    { label: 'Latest month', title: 'The most recent 31 days of loaded data', range: latestRange(bounds), available: true },
    {
      label: 'Jan 2026',
      title: 'The January 2026 study window',
      range: STUDY,
      available: bounds.min <= STUDY[0] && bounds.max >= STUDY[1],
    },
  ]

  return (
    <div role="group" aria-label="Date range presets" className="flex overflow-hidden rounded-md border border-slate-300">
      {presets.map((p) => {
        const active = start === p.range[0] && end === p.range[1]
        return (
          <button
            key={p.label}
            type="button"
            title={p.title}
            disabled={!p.available}
            aria-pressed={active}
            onClick={() => setRange(p.range[0], p.range[1])}
            className={`min-h-10 px-3 text-[13px] disabled:opacity-40 ${active ? 'bg-wind font-semibold text-white' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
