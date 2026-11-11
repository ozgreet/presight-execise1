import { useEffect, useState } from 'react'
import type { FacetItem } from '../../types/api'
import { NationalityFlag } from './NationalityFlag'

type FacetListProps = {
  title: string
  items: FacetItem[]
  selected: string[]
  search: string
  onSearchChange: (value: string) => void
  onToggle: (value: string) => void
  visibleLimit?: number
  searchIcon?: 'nationality' | 'hobbies'
}

function FacetSearchIcon({ variant }: { variant: 'nationality' | 'hobbies' }) {
  if (variant === 'nationality') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M3 12h18M12 3c2.8 3.2 2.8 14.8 0 18M12 3c-2.8 3.2-2.8 14.8 0 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21c4.2-3.1 7-6.8 7-11a7 7 0 1 0-14 0c0 4.2 2.8 7.9 7 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function getLimitedItems(items: FacetItem[], selected: string[], limit: number) {
  if (items.length <= limit) {
    return items
  }

  const selectedSet = new Set(selected)
  const visible: FacetItem[] = []
  const visibleValues = new Set<string>()

  for (const item of items) {
    if (selectedSet.has(item.value)) {
      visible.push(item)
      visibleValues.add(item.value)
    }
  }

  for (const item of items) {
    if (visible.length >= limit) {
      break
    }
    if (!visibleValues.has(item.value)) {
      visible.push(item)
      visibleValues.add(item.value)
    }
  }

  return visible
}

export function FacetList({
  title,
  items,
  selected,
  search,
  onSearchChange,
  onToggle,
  visibleLimit,
  searchIcon = 'hobbies',
}: FacetListProps) {
  const [expanded, setExpanded] = useState(false)
  const normalizedSearch = search.trim().toLowerCase()
  const filtered = items.filter((item) =>
    item.value.toLowerCase().includes(normalizedSearch),
  )

  useEffect(() => {
    setExpanded(false)
  }, [normalizedSearch])

  const isLimited =
    visibleLimit !== undefined && !expanded && normalizedSearch.length === 0
  const visibleItems = isLimited
    ? getLimitedItems(filtered, selected, visibleLimit)
    : filtered
  const hiddenCount = isLimited ? filtered.length - visibleItems.length : 0

  return (
    <section className="facet">
      <h3>{title}</h3>
      <div className="sidebar-search">
        <span className="sidebar-search-icon" aria-hidden="true">
          <FacetSearchIcon variant={searchIcon} />
        </span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}`}
          aria-label={`Search ${title.toLowerCase()}`}
        />
      </div>
      <div className="facet-list scrollbar-thin">
        {visibleItems.map((item) => {
          const isChecked = selected.includes(item.value)
          const isDisabled = item.count === 0 && !isChecked

          return (
            <label
              className={`crow${isDisabled ? ' is-disabled' : ''}`}
              key={item.value}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => onToggle(item.value)}
              />
              <span className="ccustom" />
              <span className="flabel">
                {searchIcon === 'nationality' ? (
                  <NationalityFlag nationality={item.value} />
                ) : null}
                {item.value}
              </span>
              <span className="fcount">{item.count}</span>
            </label>
          )
        })}
      </div>
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="facet-show-more"
          onClick={() => setExpanded(true)}
        >
          Show {hiddenCount} more
        </button>
      ) : expanded && visibleLimit !== undefined && normalizedSearch.length === 0 ? (
        <button
          type="button"
          className="facet-show-more"
          onClick={() => setExpanded(false)}
        >
          Show less
        </button>
      ) : null}
    </section>
  )
}
