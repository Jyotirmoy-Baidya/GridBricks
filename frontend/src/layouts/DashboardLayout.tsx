import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { useSyncFiltersToUrl } from '@/hooks/useSyncFiltersToUrl'

export default function DashboardLayout() {
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
