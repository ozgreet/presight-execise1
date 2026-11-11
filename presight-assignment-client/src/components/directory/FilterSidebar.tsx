import { useState } from 'react'
import type { FacetsResponse } from '../../types/api'
import { FacetList } from './FacetList'

type FilterSidebarProps = {
  facets: FacetsResponse
  selectedNationalities: string[]
  selectedHobbies: string[]
  onToggleNationality: (value: string) => void
  onToggleHobby: (value: string) => void
  loading?: boolean
}

function FacetListSkeleton({ title }: { title: string }) {
  return (
    <section className="facet facet-skeleton" aria-hidden="true">
      <h3>{title}</h3>
      <div className="skel facet-search-skel" />
      <div className="facet-list">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="facet-row-skel" key={index}>
            <div className="skel facet-check-skel" />
            <div className="skel facet-label-skel" />
            <div className="skel facet-count-skel" />
          </div>
        ))}
      </div>
    </section>
  )
}

function FilterSidebarSkeleton() {
  return (
    <aside className="sidebar scrollbar-thin" aria-hidden="true">
      <FacetListSkeleton title="Nationality" />
      <FacetListSkeleton title="Hobbies" />
    </aside>
  )
}

export function FilterSidebar({
  facets,
  selectedNationalities,
  selectedHobbies,
  onToggleNationality,
  onToggleHobby,
  loading = false,
}: FilterSidebarProps) {
  const [nationalitySearch, setNationalitySearch] = useState('')
  const [hobbySearch, setHobbySearch] = useState('')

  if (loading) {
    return <FilterSidebarSkeleton />
  }

  return (
    <aside className="sidebar scrollbar-thin">
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
    </aside>
  )
}
