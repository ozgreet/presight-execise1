type PageErrorProps = {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  compact?: boolean
}

export function PageError({
  title = 'Something went wrong',
  message = "We couldn't load this page. Check your connection and try again.",
  onRetry,
  retryLabel = 'Try again',
  compact = false,
}: PageErrorProps) {
  return (
    <div
      className={`page-state page-state-error${compact ? ' page-state-error-compact' : ''}`}
      role="alert"
    >
      <div className="page-state-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 8v5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" />
        </svg>
      </div>
      <h2 className="page-state-title">{title}</h2>
      <p className="page-state-copy">{message}</p>
      {onRetry ? (
        <button type="button" className="btn primary" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
