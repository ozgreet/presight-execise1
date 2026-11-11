import { useEffect, useState } from 'react'
import type { FacetsResponse } from '../../types/api'
import { FacetList } from './FacetList'

type MobileFilterSheetProps = {
  open: boolean
  facets: FacetsResponse
  selectedNationalities: string[]
  selectedHobbies: string[]
  resultCount: number
  onClose: () => void
  onToggleNationality: (value: string) => void
  onToggleHobby: (value: string) => void
  onClearAll: () => void
}

export function MobileFilterSheet({
  open,
  facets,
  selectedNationalities,
  selectedHobbies,
  resultCount,
  onClose,
  onToggleNationality,
  onToggleHobby,
  onClearAll,
}: MobileFilterSheetProps) {
  const [nationalitySearch, setNationalitySearch] = useState('')
  const [hobbySearch, setHobbySearch] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <>
      <div
        className={`sheet-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h3>Filters</h3>
          <button type="button" className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="sheet-body scrollbar-thin">
          <FacetList
            title="Nationality"
            items={facets.nationalities}
            selected={selectedNationalities}
            search={nationalitySearch}
            onSearchChange={setNationalitySearch}
            onToggle={onToggleNationality}
            visibleLimit={5}
            searchIcon="nationality"
          />
          <FacetList
            title="Hobbies"
            items={facets.hobbies}
            selected={selectedHobbies}
            search={hobbySearch}
            onSearchChange={setHobbySearch}
            onToggle={onToggleHobby}
            visibleLimit={5}
            searchIcon="hobbies"
          />
        </div>
        <div className="sheet-foot">
          <button type="button" className="btn" onClick={onClearAll}>
            Clear all
          </button>
          <button type="button" className="btn primary" onClick={onClose}>
            Show {resultCount} results
          </button>
        </div>
      </div>
    </>
  )
}
