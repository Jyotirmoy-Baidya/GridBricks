import { useCoverageStore } from '@/store/useGenerationStore'
import { formatLondon } from '@/utils/format'

export default function DataCoverageBadge({ compact }: { compact?: boolean }) {
  const { data, status } = useCoverageStore()

  const ok = data?.loaded
  const dot = status === 'error' ? 'bg-red-400' : ok ? 'bg-emerald-400' : 'bg-amber-400'
  const label = status === 'error' ? 'API unreachable' : ok ? 'Data loaded' : 'Checking data…'

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-onink-muted/30 p-3 text-xs text-onink-muted">
      <div className="flex items-center gap-1.5 font-semibold text-onink">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        {!compact && label}
      </div>
      {!compact && (
        <>
          <div>Elexon BMRS · FUELHH, WINDFOR</div>
          {data?.actual_start && data.actual_end && (
            <div className="font-mono">
              {formatLondon(data.actual_start, 'D MMM YYYY')} – {formatLondon(data.actual_end, 'D MMM YYYY')}
            </div>
          )}
        </>
      )}
    </div>
  )
}
