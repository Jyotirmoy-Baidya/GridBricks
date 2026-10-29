import Skeleton from './Skeleton'

export default function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading metrics" className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex h-[110px] flex-col gap-2.5 rounded-lg border border-slate-200 bg-white p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  )
}
