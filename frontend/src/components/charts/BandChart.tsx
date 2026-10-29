import { useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayAheadHour } from '@/types/api'
import { formatInt, formatLondon } from '@/utils/format'
import { COLORS } from '@/utils/theme'
import { AXIS_LINE, MARGIN, TICK, TOOLTIP_STYLE } from './chartStyle'

export default function BandChart({ hours, height = 320 }: { hours: DayAheadHour[]; height?: number }) {
  const data = useMemo(
    () =>
      hours.map((h) => ({
        t: Date.parse(h.t),
        forecast: h.forecast,
        count_on: h.count_on,
        actual: h.actual,
        band: h.p10 != null && h.p90 != null ? [h.p10, h.p90] : null,
      })),
    [hours],
  )
  return (
    <div style={{ width: '100%', height, minWidth: 0 }} role="img" aria-label="Hourly wind forecast with P10 to P90 range, count-on line and actual output">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={MARGIN}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tick={TICK} axisLine={AXIS_LINE} tickLine={false} tickFormatter={(t: number) => formatLondon(t, 'HH:mm')} minTickGap={40} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => `${v / 1000} GW`} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(t) => formatLondon(Number(t), 'ddd D MMM HH:mm')}
            formatter={(v, name) => [Array.isArray(v) ? `${formatInt(Number(v[0]))} to ${formatInt(Number(v[1]))} MW` : `${formatInt(Number(v))} MW`, String(name)]}
          />
          <Area name="P10–P90 range" dataKey="band" stroke="none" fill={COLORS.forecast} fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />
          <Line name="Forecast" dataKey="forecast" stroke={COLORS.forecast} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line name="Count-on" dataKey="count_on" stroke={COLORS.ink} strokeWidth={1.8} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
          <Line name="Actual" dataKey="actual" stroke="none" dot={{ r: 3.5, fill: COLORS.actual, stroke: COLORS.actual }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
