import { useState } from 'react'
import Card from '@/components/common/Card'
import type { DayAheadHour } from '@/types/api'
import { additionalGwh, windGwh, type WindSource } from '@/utils/procurement'

const KEY = 'demand-mw'
const DEFAULT_DEMAND = 30000

const read = (): string => {
  try {
    return localStorage.getItem(KEY) ?? String(DEFAULT_DEMAND)
  } catch {
    return String(DEFAULT_DEMAND)
  }
}

const ROWS: { source: WindSource; label: string; note: string }[] = [
  { source: 'forecast', label: 'Trust the forecast', note: 'Plan on the forecast as published.' },
  { source: 'adjusted', label: 'Remove the usual offset', note: 'Forecast less its typical error at this horizon.' },
  { source: 'countOn', label: 'Count only on the safe wind', note: 'Forecast less the P90 over-forecast.' },
]

const fmt = (v: number | null, dp = 1) => (v == null ? '–' : v.toFixed(dp))

export default function DemandWhatIf({ hours }: { hours: DayAheadHour[] }) {
  const [text, setText] = useState(read)
  const demand = Number(text)
  const valid = text.trim() !== '' && Number.isFinite(demand) && demand >= 0
  const hasActual = hours.length > 0 && hours.every((h) => h.actual != null)

  const onChange = (v: string) => {
    setText(v)
    try {
      localStorage.setItem(KEY, v)
    } catch {
      // storage can be blocked; the value then lasts for this visit only
    }
  }

  const rows = hasActual ? [...ROWS, { source: 'actual' as const, label: 'What wind actually delivered', note: 'For checking after the day.' }] : ROWS
  const base = valid ? additionalGwh(hours, demand, 'forecast') : null

  return (
    <Card
      title="What would I need to buy?"
      footer="Demand is not in the Elexon data this app uses, so you enter it. A flat figure for every hour is a simplification. Only hours where demand exceeds wind count; surplus wind earns nothing here."
    >
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="demand" className="text-sm text-slate-600">
          Expected demand, every hour
        </label>
        <div className="flex items-center overflow-hidden rounded-md border border-slate-300 bg-white">
          <input
            id="demand"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-10 w-28 bg-transparent px-2 text-right text-sm tabular-nums"
          />
          <span className="border-l border-slate-300 px-3 text-sm text-slate-600">MW</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13.5px] tabular-nums">
          <thead>
            <tr className="text-right text-xs uppercase tracking-wider text-slate-600">
              <th className="border-b border-slate-200 px-2.5 py-2 text-left font-semibold">If you plan on</th>
              <th className="border-b border-slate-200 px-2.5 py-2 font-semibold">Wind over the day</th>
              <th className="border-b border-slate-200 px-2.5 py-2 font-semibold">Still to buy</th>
              <th className="border-b border-slate-200 px-2.5 py-2 font-semibold">Against trusting the forecast</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const buy = valid ? additionalGwh(hours, demand, r.source) : null
              const diff = buy != null && base != null ? buy - base : null
              return (
                <tr key={r.source} className="text-right">
                  <td className="border-b border-slate-100 px-2.5 py-2 text-left">
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-xs text-slate-600">{r.note}</div>
                  </td>
                  <td className="border-b border-slate-100 px-2.5 py-2">{fmt(windGwh(hours, r.source))} GWh</td>
                  <td className="border-b border-slate-100 px-2.5 py-2 font-semibold">{fmt(buy)} GWh</td>
                  <td className="border-b border-slate-100 px-2.5 py-2 text-slate-600">
                    {diff == null || r.source === 'forecast' ? '–' : `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${Math.abs(diff).toFixed(1)} GWh`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!valid && <p role="status" className="m-0 text-sm text-red-900">Enter a demand figure of 0 MW or more.</p>}
    </Card>
  )
}
