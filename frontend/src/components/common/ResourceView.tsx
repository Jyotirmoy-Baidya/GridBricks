import type { ReactNode } from 'react'
import type { Resource } from '@/store/resource'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'

interface Props<T> {
  res: Resource<T>
  skeleton: ReactNode
  onRetry: () => void
  isEmpty?: (data: T) => boolean
  emptyMessage?: string
  children: (data: T) => ReactNode
}

/** Skeleton first, then data. While refetching, the previous data stays up, dimmed. */
export default function ResourceView<T>({
  res,
  skeleton,
  onRetry,
  isEmpty,
  emptyMessage = 'No data for this selection.',
  children,
}: Props<T>) {
  if (res.status === 'error' && !res.data) return <ErrorState error={res.error} onRetry={onRetry} />
  if (!res.data) return <>{skeleton}</>
  if (isEmpty?.(res.data)) return <EmptyState message={emptyMessage} />
  const refreshing = res.status === 'loading'
  return (
    <div aria-busy={refreshing} className={refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {children(res.data)}
    </div>
  )
}
