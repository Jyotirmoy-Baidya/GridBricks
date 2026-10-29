import { useEffect } from 'react'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import SummaryKpis from '@/components/kpi/SummaryKpis'
import KpiRowSkeleton from '@/components/skeletons/KpiRowSkeleton'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { useQueryParams } from '@/hooks/useQueryParams'
import { useSummaryStore } from '@/store/useMetricsStore'
import type { SummaryMetrics } from '@/types/api'
import { formatInt, formatPct, formatSigned } from '@/utils/format'

function rows(s: SummaryMetrics): [string, string, string][] {
  return [
    ['MAE', `${formatInt(s.mae)} MW`, 'Typical size of the miss, in the units the desk trades.'],
    ['RMSE', `${formatInt(s.rmse)} MW`, 'Like MAE but punishes large misses; a big gap to MAE means fat tails.'],
    ['Bias', `${formatSigned(s.bias)} MW`, 'Mean of forecast minus actual. Positive means the forecast runs high.'],
    ['nMAE', formatPct(s.nmae), 'MAE as a share of mean actual output, to compare across periods.'],
    ['Median |error|', `${formatInt(s.p50_abs)} MW`, 'Half of all hours miss by less than this.'],
    ['P90 |error|', `${formatInt(s.p90_abs)} MW`, 'Nine in ten hours miss by less than this. A direct buffer size.'],
    ['P99 |error|', `${formatInt(s.p99_abs)} MW`, 'The tail: one hour in a hundred misses by more.'],
    ['Over-forecast P90', `${formatInt(s.over_p90)} MW`, 'P90 of over-forecasts only, the side that leaves the desk short.'],
    ['Correlation', s.correlation == null ? '–' : s.correlation.toFixed(3), 'How well the forecast tracks the shape of actual output.'],
    ['Coverage', `${formatInt(s.n)} / ${formatInt(s.hours)} hours`, 'Hours with a forecast available at this horizon.'],
  ]
}

export default function SummaryPage() {
  const q = useQueryParams()
  const summary = useSummaryStore()
  const load = summary.load
  useEffect(() => void load(q), [load, q])

  return (
    <>
      <ResourceView res={summary} skeleton={<KpiRowSkeleton />} onRetry={() => void load(q, true)}>
        {(s) => <SummaryKpis s={s} />}
      </ResourceView>
      <Card title={`All metrics at ${q.horizon} h ahead`} footer="Error is forecast minus actual, compared hour by hour. Change the horizon or dates in the top bar.">
        <ResourceView res={summary} skeleton={<TableSkeleton rows={8} />} onRetry={() => void load(q, true)}>
          {(s) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
                <tbody>
                  {rows(s).map(([name, value, note]) => (
                    <tr key={name}>
                      <th scope="row" className="w-44 border-b border-slate-100 px-2.5 py-2.5 text-left font-semibold">{name}</th>
                      <td className="w-40 border-b border-slate-100 px-2.5 py-2.5 font-mono tabular-nums">{value}</td>
                      <td className="border-b border-slate-100 px-2.5 py-2.5 text-slate-600">{note}</td>
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
