export interface LegendItem {
  label: string
  color: string
  kind?: 'line' | 'dashed' | 'band' | 'dot'
}

export default function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12.5px] text-slate-600">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.kind === 'band' ? (
            <span className="h-2.5 w-4" style={{ background: i.color, opacity: 0.25 }} />
          ) : i.kind === 'dot' ? (
            <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
          ) : (
            <span className="w-4" style={{ borderTop: `3px ${i.kind === 'dashed' ? 'dashed' : 'solid'} ${i.color}` }} />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  )
}
