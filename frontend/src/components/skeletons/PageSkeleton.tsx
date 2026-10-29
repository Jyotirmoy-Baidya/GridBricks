export default function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
    </div>
  )
}
