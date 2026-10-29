import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/forecasts', label: 'Forecasts' },
  { to: '/dashboard/accuracy', label: 'Accuracy' },
  { to: '/dashboard/day-ahead', label: 'Day-ahead' },
  { to: '/dashboard/methodology', label: 'Methodology' },
]

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen flex-wrap">
      <nav aria-label="Main" className="w-full bg-slate-900 p-4 text-slate-200 md:w-56">
        <div className="mb-6 text-lg font-extrabold text-white">Wind Monitor</div>
        <ul className="flex flex-col gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 ${isActive ? 'bg-slate-700 font-semibold text-white' : 'hover:bg-slate-800'}`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
