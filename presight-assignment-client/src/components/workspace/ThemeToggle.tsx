type ThemeToggleProps = {
  theme: 'light' | 'dark'
  onToggle: () => void
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={`theme-toggle${isDark ? ' is-dark' : ' is-light'}`}
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
    >
      <span className="theme-toggle-track">
        <span className={`theme-toggle-icon sun${isDark ? '' : ' is-active'}`}>
          <SunIcon />
        </span>
        <span className={`theme-toggle-icon moon${isDark ? ' is-active' : ''}`}>
          <MoonIcon />
        </span>
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  )
}
