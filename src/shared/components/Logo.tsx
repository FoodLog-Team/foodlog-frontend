export function Logo({ className }: { className?: string }) {
  return (
    <span className={['logo', className ?? ''].join(' ').trim()}>
      <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="9" fill="currentColor" />
        <path
          d="M10 22c0-6.5 4.5-11.5 12-12-.4 7.4-5.4 12-12 12Zm0 0 6-6"
          fill="none"
          stroke="var(--logo-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo__text">FoodLog</span>
    </span>
  )
}
