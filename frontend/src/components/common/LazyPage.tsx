import { lazy, Suspense } from 'react'
import PageSkeleton from '@/components/skeletons/PageSkeleton'

const Placeholder = lazy(() => import('@/pages/PlaceholderPage'))

export default function LazyPage({ title }: { title: string }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Placeholder title={title} />
    </Suspense>
  )
}
