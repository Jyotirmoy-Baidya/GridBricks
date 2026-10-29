import { useEffect, useMemo, useState } from 'react'
import Card from '@/components/common/Card'
import ResourceView from '@/components/common/ResourceView'
import TargetBar from '@/components/common/TargetBar'
import KpiRow from '@/components/kpi/KpiRow'
import KpiTile from '@/components/kpi/KpiTile'
import KpiRowSkeleton from '@/components/skeletons/KpiRowSkeleton'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { useQueryParams } from '@/hooks/useQueryParams'
import { useCalibrationStore } from '@/store/useMetricsStore'
import type { Calibration } from '@/types/api'
import { formatInt, formatLondon, formatPct, formatSigned } from '@/utils/format'

const WINDOWS = [14, 30, 60, 90]

function Body({ c }: { c: Calibration }) {
  if (!c.enough_training) {
    return (
      <div role="status" className="rounded-md border border-amber-300 bg-fc-soft px-4 py-3 text-sm text-amber-900">
        There is not enough earlier data to test this range ({formatInt(c.n_train)} usable hours before it; at least 168 are needed). Pick a range that starts at least a week after the first loaded day.
      </div>
    )
  }
  const better = c.mae_raw != null && c.mae_adjusted != null && c.mae_raw > 0 ? (c.mae_raw - c.mae_adjusted) / c.mae_raw : null
  return (
    <>
      <p className="m-0 text-sm text-slate-600">
        Learned from {formatInt(c.n_train)} hours ({formatLondon(c.train_start, 'D MMM YYYY')} to {formatLondon(c.train_end, 'D MMM YYYY')}), then scored on {formatInt(c.n_test)} hours it had never seen ({formatLondon(c.test_start, 'D MMM')} to {formatLondon(c.test_end, 'D MMM YYYY')}).
      </p>

      <KpiRow>
        <KpiTile label="MAE as published" value={formatInt(c.mae_raw)} unit="MW" note={`RMSE ${formatInt(c.rmse_raw)} MW`} />
        <KpiTile label="MAE after removing the offset" value={formatInt(c.mae_adjusted)} unit="MW" tone="actual" note={better == null ? undefined : `${formatPct(better, 0)} smaller; RMSE ${formatInt(c.rmse_adjusted)} MW`} />
        <KpiTile label="Offset learned" value={formatSigned(c.train_bias)} unit="MW" tone="forecast" note="Mean of forecast minus actual in the training hours" />
        <KpiTile label="Offset in the test hours" value={formatSigned(c.test_bias)} unit="MW" note="If this differs a lot, the offset has drifted" />
      </KpiRow>

      <Card title="Do the range and the count-on line hold up?" footer="Each bar compares what the method promises with what happened in hours it had not seen. The in-sample figure is what the same method would claim if it were allowed to look at the test hours.">
        <div className="flex flex-col gap-5">
          <TargetBar
            label="P10–P90 range holds the actual"
            achieved={c.band_coverage}
            target={c.band_target}
            note={`An honest 80% range should hold the actual about 80% of the time. Marked in-sample, it would claim ${formatPct(c.band_coverage_in_sample, 0)}, which is flattering.`}
          />
          <TargetBar
            label="Actual is at or above the count-on line"
            achieved={c.count_on_hit_rate}
            target={c.count_on_target}
            note="The count-on line is meant to be reached nine hours in ten. Each miss is an hour with less wind than the safe figure."
          />
        </div>
      </Card>
    </>
  )
}

export default function ReliabilityPage() {
  const q = useQueryParams()
  const [trainDays, setTrainDays] = useState(30)
  const params = useMemo(() => ({ ...q, trainDays }), [q, trainDays])
  const store = useCalibrationStore()
  const load = store.load
  useEffect(() => void load(params), [load, params])

  return (
    <>
      <Card
        title={`How reliable is the error correction at ${q.horizon} h ahead?`}
        actions={
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span id="train-label">Learn from the previous</span>
            <div role="group" aria-labelledby="train-label" className="flex overflow-hidden rounded-md border border-slate-300">
              {WINDOWS.map((d) => (
                <button key={d} type="button" aria-pressed={trainDays === d} onClick={() => setTrainDays(d)} className={`min-h-9 px-3 text-[13px] ${trainDays === d ? 'bg-wind font-semibold text-white' : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
                  {d} days
                </button>
              ))}
            </div>
          </div>
        }
        footer="The forecast tends to run high by a steady amount, and that amount drifts over the year. A shorter learning window follows the drift better; a longer one is steadier but slower to react."
      >
        <ResourceView res={store} skeleton={<><KpiRowSkeleton /><TableSkeleton rows={3} /></>} onRetry={() => void load(params, true)}>
          {(c) => <Body c={c} />}
        </ResourceView>
      </Card>
    </>
  )
}
