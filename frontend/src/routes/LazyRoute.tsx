import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import PageSkeleton from '@/components/skeletons/PageSkeleton'

export type PageLoader = () => Promise<{ default: ComponentType }>

const pages = new WeakMap<PageLoader, LazyExoticComponent<ComponentType>>()

/** One lazy component per loader, created once, so a page keeps its state across re-renders. */
function pageFor(loader: PageLoader) {
  let page = pages.get(loader)
  if (!page) {
    page = lazy(loader)
    pages.set(loader, page)
  }
  return page
}

/** Loads a page on demand and shows the page skeleton while its code arrives. */
export default function LazyRoute({ loader }: { loader: PageLoader }) {
  const Page = pageFor(loader)
  return (
    <Suspense fallback={<PageSkeleton />}>
      {/* Stable: it comes from a module-level cache. The rule cannot see that. */}
      {/* oxlint-disable-next-line react/static-components */}
      <Page />
    </Suspense>
  )
}
