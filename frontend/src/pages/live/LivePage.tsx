import { useEffect } from 'react'
import BandChart from '@/components/charts/BandChart'
import ChartLegend from '@/components/charts/ChartLegend'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import BandsBasisNote from '@/components/dayahead/BandsBasisNote'
import DemandWhatIf from '@/components/dayahead/DemandWhatIf'
import DownloadCsvButton from '@/components/common/DownloadCsvButton'
import KpiRow from '@/components/kpi/KpiRow'
import KpiTile from '@/components/kpi/KpiTile'
import ChartSkeleton from '@/components/skeletons/ChartSkeleton'
import KpiRowSkeleton from '@/components/skeletons/KpiRowSkeleton'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import HourTable from '@/components/tables/HourTable'
import { useLiveStore } from '@/store/useLiveStore'
import type { LiveResponse } from '@/types/api'
import { formatDate, formatLondon } from '@/utils/format'
import { COLORS } from '@/utils/theme'

const REFRESH_MS = 10 * 60 * 1000

function LiveKpis({ d }: { d: LiveResponse }) {
  const gwh = (v: number | null) => (v == null ? '–' : v.toFixed(1))
  const have = d.hours.filter((h) => h.forecast != null).length
  const ageH = d.as_of ? (Date.parse(d.fetched_at) - Date.parse(d.as_of)) / 3_600_000 : null
  return (
    <>
      <KpiRow>
        <KpiTile label="Delivery day" value={formatDate(d.delivery_date)} note="Tomorrow, London time" />
        <KpiTile
          label="Latest forecast available"
          value={d.as_of ? formatLondon(d.as_of, 'HH:mm') : '–'}
          note={d.as_of ? `Published ${formatLondon(d.as_of, 'ddd D MMM')}${ageH != null ? ` · ${ageH.toFixed(1)} h ago` : ''}` : 'No forecast published yet'}
        />
        <KpiTile label="Forecast wind energy" value={gwh(d.forecast_gwh)} unit="GWh" tone="forecast" note={`${have} of ${d.hours.length} hours forecast`} />
        <KpiTile label="Wind you can count on" value={gwh(d.count_on_gwh)} unit="GWh" tone="dark" note="Forecast less the P90 over-forecast" />
      </KpiRow>
      {have < d.hours.length && (
        <div role="status" className="rounded-md border border-amber-300 bg-fc-soft px-4 py-3 text-sm text-amber-900">
          Only {have} of {d.hours.length} hours have a forecast so far, so daily totals are not shown. Elexon publishes about eight times a day.
        </div>
      )}
    </>
  )
}

export default function LivePage() {
  const store = useLiveStore()
  const load = store.load

  useEffect(() => {
    void load(undefined, true)
    const id = setInterval(() => void load(undefined, true), REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  return (
    <>
      <div role="note" className="rounded-md border border-wind/30 bg-wind-soft px-4 py-3 text-sm text-slate-800">
        <strong>Live view.</strong> This pulls the newest wind forecast straight from Elexon for tomorrow. It is not stored, and tomorrow's actual output is not known yet, so it is not part of the accuracy figures on the other pages.
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <button type="button" onClick={() => void load(undefined, true)} disabled={store.status === 'loading'} className="min-h-10 rounded-md border border-slate-300 bg-white px-4 font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50">
          Refresh
        </button>
        {store.data && <span>Fetched {formatLondon(store.data.fetched_at, 'D MMM HH:mm')} London time. Refreshes every 10 minutes.</span>}
      </div>

      <ResourceView res={store} skeleton={<KpiRowSkeleton />} onRetry={() => void load(undefined, true)}>
        {(d) => <LiveKpis d={d} />}
      </ResourceView>

      <Card
        title="Tomorrow, hour by hour"
        actions={<ChartLegend items={[{ label: 'P10–P90 range', color: COLORS.forecast, kind: 'band' }, { label: 'Forecast', color: COLORS.forecast }, { label: 'Bias-adjusted', color: COLORS.adjusted, kind: 'dashed' }, { label: 'Count-on', color: COLORS.ink, kind: 'dashed' }]} />}
        footer={store.data ? <><span>Each hour uses the newest forecast published so far. </span><BandsBasisNote basis={store.data.bands_basis} /></> : undefined}
      >
        <ResourceView res={store} skeleton={<ChartSkeleton height={340} />} onRetry={() => void load(undefined, true)}>
          {(d) => <BandChart hours={d.hours} height={340} />}
        </ResourceView>
      </Card>

      {store.data && <DemandWhatIf hours={store.data.hours} />}

      <Card
        title="Hour by hour"
        actions={store.data ? <DownloadCsvButton hours={store.data.hours} filename={`live-${store.data.delivery_date}.csv`} /> : undefined}
        footer="Values in MW. Actual output is not known yet for tomorrow."
      >
        <ResourceView res={store} skeleton={<TableSkeleton rows={8} />} onRetry={() => void load(undefined, true)}>
          {(d) => <HourTable hours={d.hours} showActual={false} />}
        </ResourceView>
      </Card>
    </>
  )
}
