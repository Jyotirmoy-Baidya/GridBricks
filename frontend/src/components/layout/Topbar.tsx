import { Link, useLocation, useMatches } from 'react-router-dom'
import CutoffPicker from '@/components/filters/CutoffPicker'
import DateRangePicker from '@/components/filters/DateRangePicker'
import HorizonSlider from '@/components/filters/HorizonSlider'

export interface RouteHandle {
  title: string
  crumbs: string[]
  filters: ('range' | 'horizon' | 'cutoff')[]
}

function isHandle(h: unknown): h is RouteHandle {
  return typeof h === 'object' && h !== null && 'title' in h && 'filters' in h
}

export default function Topbar() {
  const { search } = useLocation()
  const handle = useMatches()
    .map((m) => m.handle)
    .filter(isHandle)
    .at(-1)

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-200 bg-white px-4 py-4 md:px-8">
      <div className="flex flex-col">
        <div className="text-xs text-slate-600">
          <Link to={{ pathname: '/dashboard', search }} className="hover:underline">
            Dashboard
          </Link>
          {handle?.crumbs.map((c) => (
            <span key={c}>
              {' / '}
              <span className="text-slate-900">{c}</span>
            </span>
          ))}
        </div>
        <h1 className="font-display text-[22px] font-extrabold">{handle?.title ?? 'Wind Monitor'}</h1>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
        {handle?.filters.includes('range') && <DateRangePicker />}
        {handle?.filters.includes('horizon') && <HorizonSlider />}
        {handle?.filters.includes('cutoff') && <CutoffPicker />}
      </div>
    </header>
  )
}
