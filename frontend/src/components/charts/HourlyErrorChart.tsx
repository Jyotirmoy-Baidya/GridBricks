import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HourOfDayMetrics } from '@/types/api'
import { formatInt, formatSigned } from '@/utils/format'
import { COLORS } from '@/utils/theme'
import { AXIS_LINE, MARGIN, TICK, TOOLTIP_STYLE } from './chartStyle'

export default function HourlyErrorChart({ rows, height = 300 }: { rows: HourOfDayMetrics[]; height?: number }) {
  return (
    <div style={{ width: '100%', height, minWidth: 0 }} role="img" aria-label="Mean absolute error and bias by hour of day">
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={MARGIN}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="hour" tick={TICK} axisLine={AXIS_LINE} tickLine={false} tickFormatter={(h: number) => `${String(h).padStart(2, '0')}:00`} interval={2} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} />
          <ReferenceLine y={0} stroke="#c4cfd4" />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(h) => `${String(h).padStart(2, '0')}:00 London`}
            formatter={(v, name) => [name === 'Bias' ? `${formatSigned(Number(v))} MW` : `${formatInt(Number(v))} MW`, String(name)]}
          />
          <Bar name="MAE" dataKey="mae" fill={COLORS.actual} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Line name="Bias" dataKey="bias" stroke={COLORS.forecast} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
