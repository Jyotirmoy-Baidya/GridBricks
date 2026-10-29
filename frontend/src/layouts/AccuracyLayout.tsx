import { NavLink, Outlet, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/dashboard/accuracy', label: 'Summary', end: true },
  { to: '/dashboard/accuracy/horizon', label: 'By horizon' },
  { to: '/dashboard/accuracy/time-of-day', label: 'Time of day' },
  { to: '/dashboard/accuracy/distribution', label: 'Distribution' },
  { to: '/dashboard/accuracy/reliability', label: 'Reliability' },
]

export default function AccuracyLayout() {
  const { search } = useLocation()
  return (
    <>
      <div role="tablist" aria-label="Accuracy views" className="-mt-2 flex flex-wrap gap-1 border-b border-slate-300">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={{ pathname: t.to, search }}
            end={t.end}
            role="tab"
            className={({ isActive }) =>
              `min-h-11 border-b-2 px-4 py-2.5 ${isActive ? 'border-wind font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:text-slate-900'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </>
  )
}
