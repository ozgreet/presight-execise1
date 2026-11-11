import { PageError } from '../ui/PageError'

type DirectoryStatesProps = {
  variant: 'empty' | 'error'
  onAction: () => void
  errorMessage?: string
}

export function DirectoryEmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="empty-state">
      <h3>No one matches yet</h3>
      <p>Try removing a filter or search for a different name.</p>
      <button type="button" className="btn primary" onClick={onAction}>
        Clear all filters
      </button>
    </div>
  )
}

export function DirectoryErrorState({
  onAction,
  message,
}: {
  onAction: () => void
  message?: string
}) {
  return (
    <PageError
      compact
      title="Couldn't load results"
      message={
        message ??
        'Something went wrong fetching results. Check your connection and try again.'
      }
      onRetry={onAction}
      retryLabel="Retry"
    />
  )
}

export function DirectoryStatePanel({
  variant,
  onAction,
  errorMessage,
}: DirectoryStatesProps) {
  return variant === 'error' ? (
    <DirectoryErrorState onAction={onAction} message={errorMessage} />
  ) : (
    <DirectoryEmptyState onAction={onAction} />
  )
}
