import Skeleton from './Skeleton'

export default function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div role="status" aria-label="Loading chart" className="flex flex-col gap-3" style={{ height }}>
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  )
}
