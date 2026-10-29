import type { DayAheadHour } from '@/types/api'
import { formatInt, formatLondon } from '@/utils/format'

const TH = 'sticky top-0 bg-slate-50 px-2.5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600'
const TD = 'border-b border-slate-100 px-2.5 py-1.5'

interface Props {
  hours: DayAheadHour[]
  showActual?: boolean
}

export default function HourTable({ hours, showActual = true }: Props) {
  const heads = ['Published', 'Horizon', 'Forecast', 'P10', 'P90', 'Count-on', ...(showActual ? ['Actual'] : [])]
  return (
    <div className="max-h-[400px] overflow-auto rounded-md border border-slate-100">
      <table className="w-full min-w-[680px] border-collapse text-[13.5px] tabular-nums">
        <thead>
          <tr>
            <th className={`${TH} text-left`}>Hour (London)</th>
            {heads.map((h) => (
              <th key={h} className={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((h) => (
            <tr key={h.t} className="text-right">
              <td className={`${TD} text-left font-mono text-[12.5px]`}>{formatLondon(h.t, 'HH:mm')}</td>
              <td className={`${TD} text-slate-600`}>{h.publish_time ? formatLondon(h.publish_time, 'D MMM HH:mm') : '–'}</td>
              <td className={`${TD} text-slate-600`}>{h.horizon_h} h</td>
              <td className={`${TD} font-semibold text-fc`}>{formatInt(h.forecast)}</td>
              <td className={TD}>{formatInt(h.p10)}</td>
              <td className={TD}>{formatInt(h.p90)}</td>
              <td className={`${TD} font-semibold`}>{formatInt(h.count_on)}</td>
              {showActual && <td className={`${TD} text-wind`}>{formatInt(h.actual)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
