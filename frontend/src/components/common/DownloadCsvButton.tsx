import type { DayAheadHour } from '@/types/api'
import { downloadText, hoursToCsv } from '@/utils/csv'

export default function DownloadCsvButton({ hours, filename }: { hours: DayAheadHour[]; filename: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadText(filename, hoursToCsv(hours))}
      disabled={hours.length === 0}
      className="min-h-9 rounded-md border border-slate-300 bg-white px-3.5 text-[13px] font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
    >
      Download CSV
    </button>
  )
}
