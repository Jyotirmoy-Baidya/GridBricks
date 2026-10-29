import { useEffect } from 'react'
import ChartLegend from '@/components/charts/ChartLegend'
import ErrorHistogram from '@/components/charts/ErrorHistogram'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import WorstMissTable from '@/components/common/WorstMissTable'
import ChartSkeleton from '@/components/skeletons/ChartSkeleton'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { useQueryParams } from '@/hooks/useQueryParams'
import { useDistributionStore } from '@/store/useMetricsStore'
import { COLORS } from '@/utils/theme'

export default function DistributionPage() {
  const q = useQueryParams()
  const store = useDistributionStore()
  const load = store.load
  useEffect(() => void load(q), [load, q])

  return (
    <>
      <Card
        title={`Distribution of forecast error at ${q.horizon} h ahead`}
        actions={<ChartLegend items={[{ label: 'Over-forecast (desk left short)', color: COLORS.forecast, kind: 'band' }, { label: 'Under-forecast', color: COLORS.actual, kind: 'band' }]} />}
        footer="Number of hours falling in each band of forecast minus actual, in MW."
      >
        <ResourceView res={store} skeleton={<ChartSkeleton height={320} />} onRetry={() => void load(q, true)} isEmpty={(d) => d.counts.length === 0} emptyMessage="No forecasts at this horizon in the selected range.">
          {(d) => <ErrorHistogram dist={d} height={320} />}
        </ResourceView>
      </Card>
      <Card title="Ten largest misses" footer="Useful for matching errors to real weather events.">
        <ResourceView res={store} skeleton={<TableSkeleton rows={6} />} onRetry={() => void load(q, true)} isEmpty={(d) => d.worst.length === 0}>
          {(d) => <WorstMissTable rows={d.worst} />}
        </ResourceView>
      </Card>
    </>
  )
}
