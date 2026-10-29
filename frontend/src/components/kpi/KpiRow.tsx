import type { ReactNode } from 'react'

export default function KpiRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">{children}</div>
}
