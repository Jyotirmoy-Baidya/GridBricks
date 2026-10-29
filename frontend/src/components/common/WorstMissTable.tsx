import type { WorstMiss } from '@/types/api'
import { formatInt, formatLondon, formatSigned } from '@/utils/format'

const TH = 'border-b border-slate-200 px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600'

export default function WorstMissTable({ rows }: { rows: WorstMiss[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-[13.5px] tabular-nums">
        <thead>
          <tr className="text-left">
            <th className={TH}>Target time</th>
            <th className={TH}>Published</th>
            <th className={`${TH} text-right`}>Forecast</th>
            <th className={`${TH} text-right`}>Actual</th>
            <th className={`${TH} text-right`}>Error</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.t}>
              <td className="border-b border-slate-100 px-2.5 py-2">{formatLondon(r.t, 'ddd D MMM HH:mm')}</td>
              <td className="border-b border-slate-100 px-2.5 py-2 text-slate-600">{formatLondon(r.publish_time)}</td>
              <td className="border-b border-slate-100 px-2.5 py-2 text-right">{formatInt(r.forecast)} MW</td>
              <td className="border-b border-slate-100 px-2.5 py-2 text-right">{formatInt(r.actual)} MW</td>
              <td className={`border-b border-slate-100 px-2.5 py-2 text-right font-semibold ${r.error > 0 ? 'text-fc' : 'text-wind'}`}>{formatSigned(r.error)} MW</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
