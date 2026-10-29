import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BandChart from '@/components/charts/BandChart'
import ChartLegend from '@/components/charts/ChartLegend'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import HourTable from '@/components/tables/HourTable'
import BandsBasisNote from '@/components/dayahead/BandsBasisNote'
import DemandWhatIf from '@/components/dayahead/DemandWhatIf'
import DownloadCsvButton from '@/components/common/DownloadCsvButton'
import KpiRow from '@/components/kpi/KpiRow'
import KpiTile from '@/components/kpi/KpiTile'
import ChartSkeleton from '@/components/skeletons/ChartSkeleton'
import KpiRowSkeleton from '@/components/skeletons/KpiRowSkeleton'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { useDayAheadStore } from '@/store/useDayAheadStore'
import { useFilterStore } from '@/store/useFilterStore'
import type { DayAheadResponse } from '@/types/api'
import { addDays, formatLondon } from '@/utils/format'
import { COLORS } from '@/utils/theme'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function DayKpis({ d }: { d: DayAheadResponse }) {
  const missing = d.hours.filter((h) => h.forecast == null).length
  const gwh = (v: number | null) => (v == null ? '–' : v.toFixed(1))
  const publishes = d.hours.flatMap((h) => (h.publish_time ? [h.publish_time] : []))
  const latestPublish = publishes.length ? publishes.reduce((a, b) => (a > b ? a : b)) : null
  return (
    <>
      <KpiRow>
        <KpiTile label="Latest forecast available" value={latestPublish ? formatLondon(latestPublish, 'HH:mm') : '–'} note={latestPublish ? `Published ${formatLondon(latestPublish, 'ddd D MMM')} · cut-off ${formatLondon(d.cutoff, 'HH:mm')}` : `Nothing published before the ${formatLondon(d.cutoff, 'HH:mm')} cut-off`} />
        <KpiTile label="Forecast wind energy" value={gwh(d.forecast_gwh)} unit="GWh" tone="forecast" note="Sum of 24 hourly forecasts" />
        <KpiTile label="Wind you can count on" value={gwh(d.count_on_gwh)} unit="GWh" tone="dark" note="Forecast less the P90 over-forecast" />
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

export default function DayAheadPage() {
  const { date: param } = useParams()
  const { search } = useLocation()
  const navigate = useNavigate()
  const cutoff = useFilterStore((s) => s.cutoff)
  const bounds = useFilterStore((s) => s.bounds)
  const deliveryMin = addDays(bounds.min, 1) // a decision needs a forecast from the day before
  const deliveryMax = bounds.max
  const inRange = (d: string) => d >= deliveryMin && d <= deliveryMax
  const date = param && DATE_RE.test(param) && inRange(param) ? param : deliveryMax
  const store = useDayAheadStore()
  const load = store.load

  useEffect(() => void load({ date, cutoff }), [load, date, cutoff])

  const go = (d: string) => {
    if (inRange(d)) void navigate({ pathname: `/dashboard/day-ahead/${d}`, search })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-md border border-slate-300 bg-white">
          <button type="button" aria-label="Previous delivery day" disabled={date <= deliveryMin} onClick={() => go(addDays(date, -1))} className="min-h-10 w-10 hover:bg-slate-50 disabled:opacity-40">‹</button>
          <label htmlFor="delivery" className="border-x border-slate-300 px-3 text-sm text-slate-600">Delivery day</label>
          <input id="delivery" type="date" min={deliveryMin} max={deliveryMax} value={date} onChange={(e) => e.target.value && go(e.target.value)} className="min-h-10 px-2 text-sm" />
          <button type="button" aria-label="Next delivery day" disabled={date >= deliveryMax} onClick={() => go(addDays(date, 1))} className="min-h-10 w-10 border-l border-slate-300 hover:bg-slate-50 disabled:opacity-40">›</button>
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
              { label: 'Bias-adjusted', color: COLORS.adjusted, kind: 'dashed' },
              { label: 'Count-on', color: COLORS.ink, kind: 'dashed' },
              { label: 'Actual', color: COLORS.actual, kind: 'dot' },
            ]}
          />
        }
        footer={store.data ? <BandsBasisNote basis={store.data.bands_basis} /> : undefined}
      >
        <ResourceView res={store} skeleton={<ChartSkeleton height={340} />} onRetry={() => void load({ date, cutoff }, true)}>
          {(d) => <BandChart hours={d.hours} height={340} />}
        </ResourceView>
      </Card>

      {store.data && <DemandWhatIf hours={store.data.hours} />}

      <Card
        title="Hour by hour"
        actions={store.data ? <DownloadCsvButton hours={store.data.hours} filename={`day-ahead-${date}.csv`} /> : undefined}
        footer="Values in MW. Horizon grows through the day because one forecast covers all 24 hours."
      >
        <ResourceView res={store} skeleton={<TableSkeleton rows={8} />} onRetry={() => void load({ date, cutoff }, true)}>
          {(d) => <HourTable hours={d.hours} />}
        </ResourceView>
      </Card>
    </>
  )
}
