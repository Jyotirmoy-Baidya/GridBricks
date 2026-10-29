import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/dashboard/accuracy', label: 'Summary', end: true },
  { to: '/dashboard/accuracy/horizon', label: 'By horizon' },
  { to: '/dashboard/accuracy/time-of-day', label: 'Time of day' },
  { to: '/dashboard/accuracy/distribution', label: 'Distribution' },
]

export default function AccuracyLayout() {
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-slate-300">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            role="tab"
            className={({ isActive }) =>
              `border-b-2 px-4 py-2 ${isActive ? 'border-teal-700 font-semibold' : 'border-transparent text-slate-600'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
