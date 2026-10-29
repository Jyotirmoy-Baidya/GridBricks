import { Outlet } from 'react-router-dom'

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Outlet />
    </div>
  )
}
