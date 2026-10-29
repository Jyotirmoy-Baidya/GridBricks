import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  )
}

export const OverviewIcon = () => (
  <Icon>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
)
export const ForecastIcon = () => (
  <Icon>
    <path d="M3 17l5-6 4 3 7-9" />
    <path d="M3 21h18" />
  </Icon>
)
export const AccuracyIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </Icon>
)
export const DayAheadIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
)
export const MethodIcon = () => (
  <Icon>
    <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
    <path d="M8 8h6M8 12h6" />
  </Icon>
)
export const TurbineIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#55c2c9" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="shrink-0">
    <path d="M12 12v10M12 12 6 3M12 12l9 2M12 12 4 17" />
    <circle cx="12" cy="12" r="1.6" fill="#55c2c9" />
  </svg>
)
export const ChevronIcon = ({ flip }: { flip?: boolean }) => (
  <Icon>
    <path d={flip ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
  </Icon>
)
