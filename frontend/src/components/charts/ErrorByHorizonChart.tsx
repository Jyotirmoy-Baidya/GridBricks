import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HorizonMetrics } from '@/types/api'
import { DAY_AHEAD_HORIZON } from '@/utils/constants'
import { formatInt } from '@/utils/format'
import { METRIC_LABEL, type HorizonMetricKey } from '@/utils/metrics'
import { COLORS } from '@/utils/theme'
import { MARGIN, tickStyle, useChartTheme } from './useChartTheme'

interface Props {
  rows: HorizonMetrics[]
  metric: HorizonMetricKey
  selected?: number
  height?: number
}

export default function ErrorByHorizonChart({ rows, metric, selected, height = 260 }: Props) {
  const th = useChartTheme()
  const dot = selected != null ? rows.find((r) => r.horizon_h === selected) : undefined
  const dotValue = dot?.[metric]
  return (
    <div style={{ width: '100%', height, minWidth: 0 }} role="img" aria-label={`${METRIC_LABEL[metric]} by forecast horizon from 0 to 48 hours`}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={MARGIN}>
          <CartesianGrid stroke={th.grid} vertical={false} />
          <ReferenceArea x1={DAY_AHEAD_HORIZON[0]} x2={DAY_AHEAD_HORIZON[1]} fill={COLORS.forecast} fillOpacity={0.08} label={{ value: 'day-ahead range', position: 'insideTop', fontSize: 10, fill: th.refText }} />
          <XAxis dataKey="horizon_h" type="number" domain={[0, 48]} ticks={[0, 12, 24, 36, 48]} tick={tickStyle(th)} axisLine={{ stroke: th.axis }} tickLine={false} tickFormatter={(v: number) => `${v} h`} />
          <YAxis tick={tickStyle(th)} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} domain={[0, 'auto']} />
          <Tooltip contentStyle={th.tooltip} labelFormatter={(h) => `${h} h ahead`} formatter={(v) => [`${formatInt(Number(v))} MW`, METRIC_LABEL[metric]]} />
          <Line dataKey={metric} stroke={COLORS.actual} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
          {dot && dotValue != null && <ReferenceDot x={dot.horizon_h} y={dotValue} r={5} fill={COLORS.actual} stroke="#fff" strokeWidth={2} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
