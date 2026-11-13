import type { ReactNode } from 'react'

interface AlertProps {
  tone?: 'error' | 'info'
  children: ReactNode
}

/** Announced to assistive technology when it appears. */
export function Alert({ tone = 'error', children }: AlertProps) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
