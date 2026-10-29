import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import PageSkeleton from '@/components/skeletons/PageSkeleton'
import { useSyncFiltersToUrl } from '@/hooks/useSyncFiltersToUrl'
import { useFilterStore } from '@/store/useFilterStore'
import { useCoverageStore } from '@/store/useGenerationStore'
import type { Coverage } from '@/types/api'
import { boundsFromCoverage } from '@/utils/bounds'

function Shell({ coverage }: { coverage: Coverage | null }) {
  // Set the date limits before the URL is read, so a link to any loaded date is respected.
  useState(() => {
    const bounds = coverage && boundsFromCoverage(coverage)
    if (bounds) useFilterStore.getState().setBounds(bounds)
    return null
  })
  useSyncFiltersToUrl()
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex flex-col gap-5 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const { data, status, load } = useCoverageStore()
  useEffect(() => void load(undefined), [load])

  // Wait for the API to say what data exists. If it cannot be reached, carry on with defaults
  // so each page shows its own error state.
  if (status === 'idle' || (status === 'loading' && !data)) {
    return (
      <div className="p-8">
        <PageSkeleton />
      </div>
    )
  }
  return <Shell coverage={data} />
}
