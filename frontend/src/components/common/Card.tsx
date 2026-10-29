import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export default function Card({ title, actions, footer, children, className = '' }: CardProps) {
  return (
    <section className={`flex min-w-0 flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {title && <h2 className="font-display text-[17px] font-bold">{title}</h2>}
          {actions && <div className="ml-auto flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
      {footer && <div className="text-[12.5px] text-slate-600">{footer}</div>}
    </section>
  )
}
