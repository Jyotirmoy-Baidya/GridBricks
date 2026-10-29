import ChartSkeleton from './ChartSkeleton'
import KpiRowSkeleton from './KpiRowSkeleton'
import Skeleton from './Skeleton'

export default function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-7 w-64" />
      <KpiRowSkeleton />
      <ChartSkeleton height={320} />
    </div>
  )
}
