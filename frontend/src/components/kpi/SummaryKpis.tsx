import type { SummaryMetrics } from '@/types/api'
import { formatInt, formatPct, formatSigned } from '@/utils/format'
import KpiRow from './KpiRow'
import KpiTile from './KpiTile'

export default function SummaryKpis({ s }: { s: SummaryMetrics }) {
  return (
    <KpiRow>
      <KpiTile label="Mean abs. error" value={formatInt(s.mae)} unit="MW" note={`${formatPct(s.nmae)} of mean wind output`} />
      <KpiTile label="P90 abs. error" value={formatInt(s.p90_abs)} unit="MW" note="9 in 10 hours miss by less" />
      <KpiTile
        label="Bias"
        value={formatSigned(s.bias)}
        unit="MW"
        tone="forecast"
        note={s.bias == null ? undefined : s.bias > 0 ? 'Forecast runs high on average' : 'Forecast runs low on average'}
      />
      <KpiTile label="Coverage" value={formatPct(s.coverage)} note={`${formatInt(s.n)} of ${formatInt(s.hours)} hours have a forecast`} />
    </KpiRow>
  )
}
