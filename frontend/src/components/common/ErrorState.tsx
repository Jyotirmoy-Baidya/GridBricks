import type { ApiError } from '@/api/axiosInstance'

interface Props {
  error: ApiError | null
  onRetry: () => void
}

export default function ErrorState({ error, onRetry }: Props) {
  return (
    <div role="alert" className="flex min-h-40 flex-col items-start justify-center gap-2 rounded-md border border-red-200 bg-red-50 p-5">
      <div className="font-semibold text-red-900">Could not load this data</div>
      <div className="text-sm text-red-900/80">
        {error?.message ?? 'Unknown error'}
        {error?.status ? ` (HTTP ${error.status})` : ''}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 min-h-10 rounded-md border border-red-300 bg-white px-4 text-sm font-semibold text-red-900 hover:bg-red-100"
      >
        Try again
      </button>
    </div>
  )
}
