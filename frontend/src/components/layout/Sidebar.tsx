import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useUiStore } from '@/store/useUiStore'
import DataCoverageBadge from './DataCoverageBadge'
import { AccuracyIcon, ChevronIcon, DayAheadIcon, ForecastIcon, MethodIcon, OverviewIcon, TurbineIcon } from './icons'

const links: { to: string; label: string; icon: ReactNode; end?: boolean }[] = [
  { to: '/dashboard', label: 'Overview', icon: <OverviewIcon />, end: true },
  { to: '/dashboard/forecasts', label: 'Forecasts', icon: <ForecastIcon /> },
  { to: '/dashboard/accuracy', label: 'Accuracy', icon: <AccuracyIcon /> },
  { to: '/dashboard/day-ahead', label: 'Day-ahead', icon: <DayAheadIcon /> },
  { to: '/dashboard/methodology', label: 'Methodology', icon: <MethodIcon /> },
]

export default function Sidebar() {
  const { search } = useLocation()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)

  return (
    <nav
      aria-label="Main"
      className={`flex shrink-0 flex-col gap-5 bg-ink p-3 text-slate-300 md:sticky md:top-0 md:h-screen md:p-4 ${collapsed ? 'md:w-[72px]' : 'md:w-56'}`}
    >
      <div className="flex items-center gap-2.5 px-1">
        <TurbineIcon />
        <div className={collapsed ? 'md:hidden' : ''}>
          <div className="font-display text-base font-extrabold text-white">Wind Monitor</div>
          <div className="text-xs text-slate-400">GB day-ahead desk</div>
        </div>
      </div>

      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {links.map((l) => (
          <li key={l.to}>
            <NavLink
              to={{ pathname: l.to, search }}
              end={l.end}
              title={l.label}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-md px-3 ${isActive ? 'bg-ink-2 font-semibold text-white' : 'hover:bg-white/5'}`
              }
            >
              {l.icon}
              <span className={collapsed ? 'md:hidden' : ''}>{l.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mt-auto hidden flex-col gap-3 md:flex">
        <DataCoverageBadge compact={collapsed} />
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm hover:bg-white/5"
        >
          <ChevronIcon flip={collapsed} />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </nav>
  )
}
