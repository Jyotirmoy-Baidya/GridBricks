import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BandChart from '@/components/charts/BandChart'
import ChartLegend from '@/components/charts/ChartLegend'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import KpiRow from '@/components/kpi/KpiRow'
import KpiTile from '@/components/kpi/KpiTile'
import ChartSkeleton from '@/components/skeletons/ChartSkeleton'
import KpiRowSkeleton from '@/components/skeletons/KpiRowSkeleton'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { useDayAheadStore } from '@/store/useDayAheadStore'
import { useFilterStore } from '@/store/useFilterStore'
import type { DayAheadResponse } from '@/types/api'
import { DEFAULT_DELIVERY, DELIVERY_MAX, DELIVERY_MIN } from '@/utils/constants'
import { addDays, formatInt, formatLondon } from '@/utils/format'
import { COLORS } from '@/utils/theme'

const TH = 'sticky top-0 bg-slate-50 px-2.5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function DayKpis({ d }: { d: DayAheadResponse }) {
  const missing = d.hours.filter((h) => h.forecast == null).length
  const gwh = (v: number | null) => (v == null ? '–' : v.toFixed(1))
  return (
    <>
      <KpiRow>
        <KpiTile label="Cut-off" value={formatLondon(d.cutoff, 'HH:mm')} note={`${formatLondon(d.cutoff, 'ddd D MMM')} London time`} />
        <KpiTile label="Forecast wind energy" value={gwh(d.forecast_gwh)} unit="GWh" tone="forecast" note="Sum of 24 hourly forecasts" />
        <KpiTile label="Wind you can count on" value={gwh(d.count_on_gwh)} unit="GWh" tone="dark" note="Forecast less January's P90 over-forecast" />
        <KpiTile label="Actual (after the fact)" value={gwh(d.actual_gwh)} unit="GWh" tone="actual" note={d.actual_gwh == null ? 'Not all hours reported' : 'Hourly outturn from FUELHH'} />
      </KpiRow>
      {missing > 0 && (
        <div role="status" className="rounded-md border border-amber-300 bg-fc-soft px-4 py-3 text-sm text-amber-900">
          {missing} of {d.hours.length} hours had no forecast published before this cut-off, so totals are not shown.
        </div>
      )}
    </>
  )
}

function HourTable({ d }: { d: DayAheadResponse }) {
  return (
    <div className="max-h-[400px] overflow-auto rounded-md border border-slate-100">
      <table className="w-full min-w-[680px] border-collapse text-[13.5px] tabular-nums">
        <thead>
          <tr>
            <th className={`${TH} text-left`}>Hour (London)</th>
            {['Horizon', 'Forecast', 'P10', 'P90', 'Count-on', 'Actual'].map((h) => <th key={h} className={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {d.hours.map((h) => (
            <tr key={h.t} className="text-right">
              <td className="border-b border-slate-100 px-2.5 py-1.5 text-left font-mono text-[12.5px]">{formatLondon(h.t, 'HH:mm')}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5 text-slate-600">{h.horizon_h} h</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5 font-semibold text-fc">{formatInt(h.forecast)}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5">{formatInt(h.p10)}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5">{formatInt(h.p90)}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5 font-semibold">{formatInt(h.count_on)}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5 text-wind">{formatInt(h.actual)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DayAheadPage() {
  const { date: param } = useParams()
  const { search } = useLocation()
  const navigate = useNavigate()
  const cutoff = useFilterStore((s) => s.cutoff)
  const date = param && DATE_RE.test(param) ? param : DEFAULT_DELIVERY
  const store = useDayAheadStore()
  const load = store.load

  useEffect(() => void load({ date, cutoff }), [load, date, cutoff])

  const go = (d: string) => {
    if (d >= DELIVERY_MIN && d <= DELIVERY_MAX) void navigate({ pathname: `/dashboard/day-ahead/${d}`, search })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-md border border-slate-300 bg-white">
          <button type="button" aria-label="Previous delivery day" disabled={date <= DELIVERY_MIN} onClick={() => go(addDays(date, -1))} className="min-h-10 w-10 hover:bg-slate-50 disabled:opacity-40">‹</button>
          <label htmlFor="delivery" className="border-x border-slate-300 px-3 text-sm text-slate-600">Delivery day</label>
          <input id="delivery" type="date" min={DELIVERY_MIN} max={DELIVERY_MAX} value={date} onChange={(e) => e.target.value && go(e.target.value)} className="min-h-10 px-2 text-sm" />
          <button type="button" aria-label="Next delivery day" disabled={date >= DELIVERY_MAX} onClick={() => go(addDays(date, 1))} className="min-h-10 w-10 border-l border-slate-300 hover:bg-slate-50 disabled:opacity-40">›</button>
        </div>
        <p className="m-0 text-sm text-slate-600">The desk buys on the day before, using the last forecast published before the cut-off.</p>
      </div>

      <ResourceView res={store} skeleton={<KpiRowSkeleton />} onRetry={() => void load({ date, cutoff }, true)}>
        {(d) => <DayKpis d={d} />}
      </ResourceView>

      <Card
        title="Hourly wind for the delivery day"
        actions={
          <ChartLegend
            items={[
              { label: 'P10–P90 range', color: COLORS.forecast, kind: 'band' },
              { label: 'Forecast', color: COLORS.forecast },
              { label: 'Count-on', color: COLORS.ink, kind: 'dashed' },
              { label: 'Actual', color: COLORS.actual, kind: 'dot' },
            ]}
          />
        }
        footer="The range and count-on line come from how wrong forecasts at the same horizon were across all loaded data, so they are an in-sample guide."
      >
        <ResourceView res={store} skeleton={<ChartSkeleton height={340} />} onRetry={() => void load({ date, cutoff }, true)}>
          {(d) => <BandChart hours={d.hours} height={340} />}
        </ResourceView>
      </Card>

      <Card title="Hour by hour" footer="Values in MW. Horizon grows through the day because one forecast covers all 24 hours.">
        <ResourceView res={store} skeleton={<TableSkeleton rows={8} />} onRetry={() => void load({ date, cutoff }, true)}>
          {(d) => <HourTable d={d} />}
        </ResourceView>
      </Card>
    </>
  )
}
