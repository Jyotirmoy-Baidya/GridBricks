import { useEffect, useMemo, useState } from 'react'
import ErrorByHorizonChart from '@/components/charts/ErrorByHorizonChart'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import ChartSkeleton from '@/components/skeletons/ChartSkeleton'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { useQueryParams } from '@/hooks/useQueryParams'
import { useByHorizonStore } from '@/store/useMetricsStore'
import { formatInt, formatPct, formatSigned } from '@/utils/format'
import { METRIC_LABEL, type HorizonMetricKey } from '@/utils/metrics'

const SELECTED = [1, 4, 12, 24, 36, 48]
const TH = 'border-b border-slate-200 px-2.5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600'

export default function HorizonPage() {
  const q = useQueryParams()
  const range = useMemo(() => ({ start: q.start, end: q.end }), [q.start, q.end])
  const store = useByHorizonStore()
  const load = store.load
  const [metric, setMetric] = useState<HorizonMetricKey>('mae')
  useEffect(() => void load(range), [load, range])

  return (
    <>
      <Card
        title="How error grows with forecast horizon"
        actions={
          <div role="group" aria-label="Metric" className="flex overflow-hidden rounded-md border border-slate-300">
            {(Object.keys(METRIC_LABEL) as HorizonMetricKey[]).map((m) => (
              <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)} className={`min-h-9 px-3.5 text-[13px] ${metric === m ? 'bg-wind text-white' : 'bg-white text-slate-900'}`}>
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
        }
        footer="Each point uses, for every hour in the range, the newest forecast published at least h hours before it. The shaded band is the horizon range a 09:00 day-ahead cut-off produces."
      >
        <ResourceView res={store} skeleton={<ChartSkeleton height={340} />} onRetry={() => void load(range, true)}>
          {(d) => <ErrorByHorizonChart rows={d.rows} metric={metric} selected={q.horizon} height={340} />}
        </ResourceView>
      </Card>

      <Card title="Selected horizons" footer="All values in MW except nMAE and coverage. Bias is forecast minus actual. Coverage falls near 48 h because fewer early forecasts exist.">
        <ResourceView res={store} skeleton={<TableSkeleton rows={6} />} onRetry={() => void load(range, true)}>
          {(d) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-[13.5px] tabular-nums">
                <thead>
                  <tr>
                    <th className={`${TH} text-left`}>Horizon</th>
                    {['MAE', 'RMSE', 'Bias', 'nMAE', 'P90 |error|', 'Coverage'].map((h) => <th key={h} className={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {d.rows.filter((r) => SELECTED.includes(r.horizon_h)).map((r) => (
                    <tr key={r.horizon_h} className="text-right">
                      <td className="border-b border-slate-100 px-2.5 py-2 text-left font-semibold">{r.horizon_h} h</td>
                      <td className="border-b border-slate-100 px-2.5 py-2">{formatInt(r.mae)}</td>
                      <td className="border-b border-slate-100 px-2.5 py-2">{formatInt(r.rmse)}</td>
                      <td className="border-b border-slate-100 px-2.5 py-2 text-fc">{formatSigned(r.bias)}</td>
                      <td className="border-b border-slate-100 px-2.5 py-2">{formatPct(r.nmae)}</td>
                      <td className="border-b border-slate-100 px-2.5 py-2">{formatInt(r.p90_abs)}</td>
                      <td className="border-b border-slate-100 px-2.5 py-2">{formatPct(r.coverage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ResourceView>
      </Card>
    </>
  )
}
