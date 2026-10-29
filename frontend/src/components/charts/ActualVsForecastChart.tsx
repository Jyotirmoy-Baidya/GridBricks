import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ComparisonPoint } from '@/types/api'
import { formatInt, formatLondon } from '@/utils/format'
import { COLORS } from '@/utils/theme'
import { AXIS_LINE, MARGIN, TICK, TOOLTIP_STYLE } from './chartStyle'

interface Props {
  points: ComparisonPoint[]
  height?: number
}

const DAY_MS = 86_400_000

export default function ActualVsForecastChart({ points, height = 320 }: Props) {
  const data = useMemo(
    () => points.map((p) => ({ t: Date.parse(p.t), actual: p.actual, forecast: p.forecast })),
    [points],
  )
  const spanDays = data.length > 1 ? (data[data.length - 1].t - data[0].t) / DAY_MS : 0
  const tickFmt = (t: number) => formatLondon(t, spanDays > 3 ? 'D MMM' : 'D MMM HH:mm')

  return (
    <div style={{ width: '100%', height, minWidth: 0 }} role="img" aria-label="Line chart of actual and forecast wind generation">
      <ResponsiveContainer>
        <LineChart data={data} margin={MARGIN}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tick={TICK} axisLine={AXIS_LINE} tickLine={false} tickFormatter={tickFmt} minTickGap={48} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => `${v / 1000} GW`} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(t) => formatLondon(Number(t), 'ddd D MMM HH:mm')}
            formatter={(v, name) => [`${formatInt(Number(v))} MW`, String(name)]}
          />
          <Line name="Actual (FUELHH)" dataKey="actual" stroke={COLORS.actual} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line name="Forecast" dataKey="forecast" stroke={COLORS.forecast} strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
