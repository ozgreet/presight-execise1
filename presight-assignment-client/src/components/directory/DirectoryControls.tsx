import { useEffect, useRef, useState } from 'react'
import type { DirectoryFilters } from '../../types/api'
import { NationalityFlag } from './NationalityFlag'
import { SORT_OPTIONS } from './utils'

type ActiveFilterChipsProps = {
  filters: DirectoryFilters
  onRemoveNationality: (value: string) => void
  onRemoveHobby: (value: string) => void
  onClearSearch: () => void
  onClearAll: () => void
}

export function ActiveFilterChips({
  filters,
  onRemoveNationality,
  onRemoveHobby,
  onClearSearch,
  onClearAll,
}: ActiveFilterChipsProps) {
  const hasFilters =
    filters.q.trim().length > 0 ||
    filters.nationalities.length > 0 ||
    filters.hobbies.length > 0

  if (!hasFilters) {
    return null
  }

  return (
    <div className="chips-row">
      {filters.q.trim() ? (
        <span className="chip">
          &quot;{filters.q.trim()}&quot;
          <button type="button" onClick={onClearSearch} aria-label="Clear search">
            ✕
          </button>
        </span>
      ) : null}
      {filters.nationalities.map((nationality) => (
        <span className="chip" key={nationality}>
          <NationalityFlag nationality={nationality} />
          {nationality}
          <button
            type="button"
            onClick={() => onRemoveNationality(nationality)}
            aria-label={`Remove ${nationality}`}
          >
            ✕
          </button>
        </span>
      ))}
      {filters.hobbies.map((hobby) => (
        <span className="chip" key={hobby}>
          {hobby}
          <button
            type="button"
            onClick={() => onRemoveHobby(hobby)}
            aria-label={`Remove ${hobby}`}
          >
            ✕
          </button>
        </span>
      ))}
      <button type="button" className="clear-all" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  )
}

type SortControlsProps = {
  sort: DirectoryFilters['sort']
  order: DirectoryFilters['order']
  onSortChange: (
    sort: DirectoryFilters['sort'],
    order: DirectoryFilters['order'],
  ) => void
  iconOnly?: boolean
}

function SortIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h12M4 12h8M4 17h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 5v14M18 5l3 3M18 5l-3 3M18 19l3-3M18 19l-3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FilterToolbarButton({
  activeCount,
  onClick,
}: {
  activeCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`toolbar-icon-btn${activeCount > 0 ? ' is-active' : ''}`}
      onClick={onClick}
      aria-label={
        activeCount > 0 ? `Filters, ${activeCount} active` : 'Open filters'
      }
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 6h16M7 12h10M10 18h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="6" cy="6" r="2" fill="currentColor" />
        <circle cx="14" cy="12" r="2" fill="currentColor" />
        <circle cx="12" cy="18" r="2" fill="currentColor" />
      </svg>
      {activeCount > 0 ? (
        <span className="toolbar-icon-badge">{activeCount}</span>
      ) : null}
    </button>
  )
}

export function SortControls({
  sort,
  order,
  onSortChange,
  iconOnly = false,
}: SortControlsProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  const currentLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Sort'

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div className="sort-anchor" ref={anchorRef}>
      <button
        type="button"
        className={`sort-btn${iconOnly ? ' toolbar-icon-btn' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={`Sort by ${currentLabel}, ${order === 'asc' ? 'ascending' : 'descending'}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {iconOnly ? (
          <SortIcon />
        ) : (
          <>
            <span className="sort-btn-label">Sort · {currentLabel}</span>
            <span className="sort-btn-arrows" aria-hidden="true">
              <svg
                className={`sort-chevron up${order === 'asc' ? ' active' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M7 14l5-5 5 5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg
                className={`sort-chevron down${order === 'desc' ? ' active' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M7 10l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </>
        )}
      </button>
      {open ? (
        <div
          className={`sort-menu${iconOnly ? ' sort-menu-toolbar' : ''}`}
          role="menu"
        >
          {SORT_OPTIONS.map((option) => {
            const isActive = sort === option.value

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={`sort-menu-item${isActive ? ' active' : ''}`}
                onClick={() => onSortChange(option.value, order)}
              >
                <span className="sort-option-radio" aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            )
          })}
          <div className="sort-menu-divider" role="separator" />
          {(
            [
              { value: 'asc' as const, label: 'Ascending' },
              { value: 'desc' as const, label: 'Descending' },
            ] as const
          ).map((direction) => {
            const isActive = order === direction.value

            return (
              <button
                key={direction.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={`sort-menu-item${isActive ? ' active' : ''}`}
                onClick={() => onSortChange(sort, direction.value)}
              >
                <span className="sort-option-radio" aria-hidden="true" />
                <span>{direction.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
