import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DistributionResponse } from '@/types/api'
import { formatInt, formatSigned } from '@/utils/format'
import { COLORS } from '@/utils/theme'
import { AXIS_LINE, MARGIN, TICK, TOOLTIP_STYLE } from './chartStyle'

export default function ErrorHistogram({ dist, height = 300 }: { dist: DistributionResponse; height?: number }) {
  const data = useMemo(
    () =>
      dist.counts.map((count, i) => {
        const lo = dist.bin_edges[i]
        const hi = dist.bin_edges[i + 1]
        return { mid: (lo + hi) / 2, label: `${formatSigned(lo)} to ${formatSigned(hi)} MW`, count }
      }),
    [dist],
  )
  return (
    <div style={{ width: '100%', height, minWidth: 0 }} role="img" aria-label="Histogram of forecast error in MW">
      <ResponsiveContainer>
        <BarChart data={data} margin={MARGIN} barCategoryGap={1}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="mid" tick={TICK} axisLine={AXIS_LINE} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} interval="preserveStartEnd" minTickGap={28} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
          <ReferenceLine x={0} stroke="#c4cfd4" />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} formatter={(v) => [`${formatInt(Number(v))} hours`, 'Count']} />
          <Bar dataKey="count" isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.mid} fill={d.mid > 0 ? COLORS.forecast : COLORS.actual} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
