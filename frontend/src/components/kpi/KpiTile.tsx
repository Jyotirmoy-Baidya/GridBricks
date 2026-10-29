interface Props {
  label: string
  value: string
  unit?: string
  note?: string
  tone?: 'default' | 'forecast' | 'actual' | 'dark'
}

const VALUE_TONE = {
  default: 'text-slate-900',
  forecast: 'text-fc',
  actual: 'text-wind',
  dark: 'text-onink',
} as const

export default function KpiTile({ label, value, unit, note, tone = 'default' }: Props) {
  const dark = tone === 'dark'
  return (
    <div className={`flex min-w-0 flex-col gap-1 rounded-lg border p-4 ${dark ? 'border-ink bg-ink' : 'border-slate-200 bg-white'}`}>
      <div className={`text-xs uppercase tracking-wider ${dark ? 'text-onink-muted' : 'text-slate-600'}`}>{label}</div>
      <div className={`font-display text-[28px] font-bold tabular-nums ${VALUE_TONE[tone]}`}>
        {value}
        {unit && <span className={`ml-1 text-sm font-normal ${dark ? 'text-onink-muted' : 'text-slate-600'}`}>{unit}</span>}
      </div>
      {note && <div className={`text-[12.5px] ${dark ? 'text-onink-muted' : 'text-slate-600'}`}>{note}</div>}
    </div>
  )
}
