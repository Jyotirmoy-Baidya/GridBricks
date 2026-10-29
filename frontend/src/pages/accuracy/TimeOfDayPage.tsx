import { useEffect } from 'react'
import ChartLegend from '@/components/charts/ChartLegend'
import HourlyErrorChart from '@/components/charts/HourlyErrorChart'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import ChartSkeleton from '@/components/skeletons/ChartSkeleton'
import { useQueryParams } from '@/hooks/useQueryParams'
import { useByHourStore } from '@/store/useMetricsStore'
import { COLORS } from '@/utils/theme'

export default function TimeOfDayPage() {
  const q = useQueryParams()
  const store = useByHourStore()
  const load = store.load
  useEffect(() => void load(q), [load, q])

  return (
    <Card
      title={`Error by hour of day at ${q.horizon} h ahead`}
      actions={<ChartLegend items={[{ label: 'MAE', color: COLORS.actual }, { label: 'Bias (forecast − actual)', color: COLORS.forecast }]} />}
      footer="Hours are Europe/London. Each bar averages every day in the selected range."
    >
      <ResourceView res={store} skeleton={<ChartSkeleton height={340} />} onRetry={() => void load(q, true)} isEmpty={(d) => d.rows.length === 0} emptyMessage="No forecasts at this horizon in the selected range.">
        {(d) => <HourlyErrorChart rows={d.rows} height={340} />}
      </ResourceView>
    </Card>
  )
}
