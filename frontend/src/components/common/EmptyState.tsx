export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 p-6 text-center text-slate-600">
      <div className="font-semibold text-slate-800">Nothing to show</div>
      <div className="max-w-md text-sm">{message}</div>
    </div>
  )
}
