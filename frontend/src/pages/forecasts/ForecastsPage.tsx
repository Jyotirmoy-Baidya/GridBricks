import { useEffect, useState } from 'react'
import ActualVsForecastChart from '@/components/charts/ActualVsForecastChart'
import ChartLegend from '@/components/charts/ChartLegend'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import ChartSkeleton from '@/components/skeletons/ChartSkeleton'
import { useQueryParams } from '@/hooks/useQueryParams'
import { useComparisonStore } from '@/store/useGenerationStore'
import type { ComparisonPoint } from '@/types/api'
import { formatInt, formatLondon, formatSigned } from '@/utils/format'
import { COLORS } from '@/utils/theme'

const TH = 'sticky top-0 bg-slate-50 px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600'

function PointsTable({ points }: { points: ComparisonPoint[] }) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-md border border-slate-100">
      <table className="w-full min-w-[620px] border-collapse text-[13.5px] tabular-nums">
        <thead>
          <tr className="text-right">
            <th className={`${TH} text-left`}>Target time</th>
            <th className={`${TH} text-left`}>Forecast published</th>
            <th className={TH}>Forecast</th>
            <th className={TH}>Actual</th>
            <th className={TH}>Error</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.t} className="text-right">
              <td className="border-b border-slate-100 px-2.5 py-1.5 text-left font-mono text-[12.5px]">{formatLondon(p.t, 'ddd D MMM HH:mm')}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5 text-left text-slate-600">{p.publish_time ? formatLondon(p.publish_time) : 'none available'}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5 text-fc">{p.forecast == null ? '–' : formatInt(p.forecast)}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5 text-wind">{formatInt(p.actual)}</td>
              <td className="border-b border-slate-100 px-2.5 py-1.5">{p.error == null ? '–' : formatSigned(p.error)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ForecastsPage() {
  const q = useQueryParams()
  const comparison = useComparisonStore()
  const load = comparison.load
  const [view, setView] = useState<'chart' | 'table'>('chart')

  useEffect(() => void load(q), [load, q])

  return (
    <Card
      title={`Forecast available ${q.horizon} h before delivery vs actual`}
      actions={
        <>
          <ChartLegend items={[{ label: 'Actual (FUELHH)', color: COLORS.actual }, { label: 'Forecast (WINDFOR)', color: COLORS.forecast, kind: 'dashed' }]} />
          <div role="group" aria-label="View" className="flex overflow-hidden rounded-md border border-slate-300">
            {(['chart', 'table'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`min-h-9 px-3.5 text-[13px] capitalize ${view === v ? 'bg-wind text-white' : 'bg-white text-slate-900'}`}>
                {v}
              </button>
            ))}
          </div>
        </>
      }
      footer="For each hour, the chart uses the newest forecast published at least this many hours earlier. Hours with no such forecast are left as gaps."
    >
      <ResourceView res={comparison} skeleton={<ChartSkeleton height={380} />} onRetry={() => void load(q, true)} isEmpty={(d) => d.points.length === 0}>
        {(d) => (view === 'chart' ? <ActualVsForecastChart points={d.points} height={380} /> : <PointsTable points={d.points} />)}
      </ResourceView>
    </Card>
  )
}
