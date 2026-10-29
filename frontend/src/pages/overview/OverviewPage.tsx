import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ChartLegend from '@/components/charts/ChartLegend'
import ActualVsForecastChart from '@/components/charts/ActualVsForecastChart'
import ErrorByHorizonChart from '@/components/charts/ErrorByHorizonChart'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import WorstMissTable from '@/components/common/WorstMissTable'
import SummaryKpis from '@/components/kpi/SummaryKpis'
import ChartSkeleton from '@/components/skeletons/ChartSkeleton'
import KpiRowSkeleton from '@/components/skeletons/KpiRowSkeleton'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { useQueryParams } from '@/hooks/useQueryParams'
import { useComparisonStore } from '@/store/useGenerationStore'
import { useByHorizonStore, useDistributionStore, useSummaryStore } from '@/store/useMetricsStore'
import type { ByHorizonResponse, DistributionResponse, SummaryMetrics } from '@/types/api'
import { addDays, formatInt, formatLondon, formatPct, formatSigned } from '@/utils/format'
import { COLORS } from '@/utils/theme'

function Findings({ summary, byHorizon, dist }: { summary: SummaryMetrics; byHorizon: ByHorizonResponse; dist: DistributionResponse }) {
  const items: string[] = []
  const first = byHorizon.rows.find((r) => r.horizon_h === 1)
  const last = [...byHorizon.rows].reverse().find((r) => r.mae != null && r.n > 0)
  if (first?.mae != null && last?.mae != null && first.mae > 0) {
    items.push(
      `Error grows with lead time: MAE is ${formatInt(first.mae)} MW at 1 h ahead and ${formatInt(last.mae)} MW at ${last.horizon_h} h (${formatSigned(((last.mae - first.mae) / first.mae) * 100)}%).`,
    )
  }
  if (summary.bias != null && summary.nmae != null) {
    const dir = summary.bias > 0 ? 'above' : 'below'
    items.push(
      `At the selected horizon the forecast averages ${formatInt(Math.abs(summary.bias))} MW ${dir} actual output, so most of the error is a steady offset, not random noise.`,
    )
  }
  const worst = dist.worst[0]
  if (worst) {
    items.push(`Largest single miss: ${formatSigned(worst.error)} MW on ${formatLondon(worst.t, 'ddd D MMM [at] HH:mm')}.`)
  }
  return (
    <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 leading-relaxed">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ol>
  )
}

export default function OverviewPage() {
  const { search } = useLocation()
  const q = useQueryParams()
  const recent = useMemo(() => {
    const endDay = q.end.slice(0, 10)
    const from = `${addDays(endDay, -7)}T00:00:00Z`
    return { ...q, start: from > q.start ? from : q.start }
  }, [q])
  const rangeParams = useMemo(() => ({ start: q.start, end: q.end }), [q.start, q.end])

  const summary = useSummaryStore()
  const comparison = useComparisonStore()
  const byHorizon = useByHorizonStore()
  const dist = useDistributionStore()
  const loadSummary = summary.load
  const loadComparison = comparison.load
  const loadByHorizon = byHorizon.load
  const loadDist = dist.load

  useEffect(() => void loadSummary(q), [loadSummary, q])
  useEffect(() => void loadComparison(recent), [loadComparison, recent])
  useEffect(() => void loadByHorizon(rangeParams), [loadByHorizon, rangeParams])
  useEffect(() => void loadDist(q), [loadDist, q])

  return (
    <>
      <ResourceView res={summary} skeleton={<KpiRowSkeleton />} onRetry={() => void loadSummary(q, true)}>
        {(s) => <SummaryKpis s={s} />}
      </ResourceView>

      <Card
        title="Actual vs forecast · last 7 days of the range"
        actions={
          <>
            <ChartLegend items={[{ label: 'Actual (FUELHH)', color: COLORS.actual }, { label: `Forecast at ${q.horizon} h ahead`, color: COLORS.forecast, kind: 'dashed' }]} />
            <Link to={{ pathname: '/dashboard/forecasts', search }} className="text-[13px] text-wind underline">
              Open in Forecasts
            </Link>
          </>
        }
      >
        <ResourceView res={comparison} skeleton={<ChartSkeleton />} onRetry={() => void loadComparison(recent, true)} isEmpty={(d) => d.points.length === 0}>
          {(d) => <ActualVsForecastChart points={d.points} />}
        </ResourceView>
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
        <Card
          title="Error grows with horizon"
          actions={
            <Link to={{ pathname: '/dashboard/accuracy/horizon', search }} className="text-[13px] text-wind underline">
              Details
            </Link>
          }
          footer="MAE in MW by hours between publish and delivery. The dot marks the selected horizon."
        >
          <ResourceView res={byHorizon} skeleton={<ChartSkeleton height={240} />} onRetry={() => void loadByHorizon(rangeParams, true)}>
            {(d) => <ErrorByHorizonChart rows={d.rows} metric="mae" selected={q.horizon} height={240} />}
          </ResourceView>
        </Card>

        <Card title="What this range tells the desk" footer={`Computed from the data on screen. Coverage is ${summary.data ? formatPct(summary.data.coverage) : '…'} of hours at this horizon.`}>
          {summary.data && byHorizon.data && dist.data ? (
            <Findings summary={summary.data} byHorizon={byHorizon.data} dist={dist.data} />
          ) : (
            <TableSkeleton rows={4} />
          )}
        </Card>
      </div>

      <Card title={`Largest misses at ${q.horizon} h`}>
        <ResourceView res={dist} skeleton={<TableSkeleton />} onRetry={() => void loadDist(q, true)} isEmpty={(d) => d.worst.length === 0}>
          {(d) => <WorstMissTable rows={d.worst.slice(0, 5)} />}
        </ResourceView>
      </Card>
    </>
  )
}
