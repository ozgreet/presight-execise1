import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useCollapseHeaderOnScroll } from '../../hooks/useCollapseHeaderOnScroll'
import { useDirectoryParams } from '../../hooks/useDirectoryParams'
import { useInsights } from '../../hooks/useInsights'
import { useScrollContainer } from '../../hooks/useScrollContainer'
import { useUsersDirectory } from '../../hooks/useUsersDirectory'
import {
  ActiveFilterChips,
  FilterToolbarButton,
  SortControls,
} from './DirectoryControls'
import { DirectoryStatePanel } from './DirectoryStates'
import { FilterSidebar } from './FilterSidebar'
import { InsightsDetailModal, InsightsStatCards } from './InsightsPanel'
import { MobileFilterSheet } from './MobileFilterSheet'
import { UserList } from './UserList'
import { PageError } from '../ui/PageError'

function SearchField({
  value,
  onChange,
  placeholder,
  variant = 'desktop',
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  variant?: 'desktop' | 'mobile'
}) {
  const icon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M21 21l-4.3-4.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )

  if (variant === 'mobile') {
    return (
      <div className="m-search">
        <span className="m-search-icon" aria-hidden="true">
          {icon}
        </span>
        <input
          className="m-search-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>
    )
  }

  return (
    <div className="search-wrap">
      <span className="search-icon" aria-hidden="true">
        {icon}
      </span>
      <input
        className="search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}

export function PeoplePage() {
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const listColumns = breakpoint === 'desktop' ? 3 : breakpoint === 'tablet' ? 2 : 1
  const { scrollRef, scrollElement } = useScrollContainer()
  useCollapseHeaderOnScroll(scrollElement, isDesktop)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const {
    filters,
    updateFilters,
    toggleNationality,
    toggleHobby,
    clearFilters,
    setSort,
  } = useDirectoryParams()

  const [searchDraft, setSearchDraft] = useState(filters.q)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [committedSearch, setCommittedSearch] = useState(filters.q)

  if (filters.q !== committedSearch) {
    setCommittedSearch(filters.q)
    setSearchDraft(filters.q)
  }

  const debouncedSearch = useDebouncedValue(searchDraft, 300)

  useEffect(() => {
    if (debouncedSearch === searchDraft && debouncedSearch !== filters.q) {
      updateFilters({ q: debouncedSearch })
    }
  }, [debouncedSearch, searchDraft, filters.q, updateFilters])

  useEffect(() => {
    if (!scrollElement) {
      return
    }

    scrollElement.scrollTop = 0
  }, [
    scrollElement,
    filters.q,
    filters.sort,
    filters.order,
    filters.nationalities.join('\0'),
    filters.hobbies.join('\0'),
  ])

  const {
    users,
    facets,
    pagination,
    loading,
    loadingMore,
    error,
    loadMore,
    retry,
  } = useUsersDirectory(filters)

  const {
    overview,
    loading: insightsLoading,
    error: insightsError,
    retry: retryInsights,
  } = useInsights(filters)

  const activeFilterCount = filters.nationalities.length + filters.hobbies.length
  const isBootstrapping = loading && users.length === 0
  const isFatalError = !loading && Boolean(error) && users.length === 0
  const showLoadMoreError = !loading && Boolean(error) && users.length > 0
  const showEmpty = !loading && !error && users.length === 0
  const total = pagination?.total ?? 0

  const clearSearch = () => {
    setSearchDraft('')
    setCommittedSearch('')
    updateFilters({ q: '' })
  }

  const clearAll = () => {
    setSearchDraft('')
    setCommittedSearch('')
    clearFilters()
  }

  const insightsSection = (
    <>
      <InsightsStatCards
        overview={overview}
        loading={insightsLoading}
        onOpenDetails={() => setInsightsOpen(true)}
      />
      <InsightsDetailModal
        open={insightsOpen}
        overview={overview}
        loading={insightsLoading}
        error={insightsError}
        onClose={() => setInsightsOpen(false)}
        onRetry={retryInsights}
      />
    </>
  )

  const listContent = showEmpty ? (
    <DirectoryStatePanel variant="empty" onAction={clearAll} />
  ) : (
    <UserList
      key={[
        filters.q,
        filters.sort,
        filters.order,
        filters.nationalities.join(','),
        filters.hobbies.join(','),
        listColumns,
      ].join('|')}
      scrollElement={scrollElement}
      users={users}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={pagination?.hasMore ?? false}
      onLoadMore={loadMore}
      columns={listColumns}
    />
  )

  const loadMoreErrorBanner = showLoadMoreError ? (
    <div className="inline-error-banner" role="alert">
      <p>{error}</p>
      <button type="button" className="btn" onClick={retry}>
        Retry
      </button>
    </div>
  ) : null

  if (isFatalError) {
    return (
      <div className="people-page">
        <PageError
          title="Directory couldn't load"
          message={error ?? "We couldn't load the directory. Check your connection and try again."}
          onRetry={retry}
        />
      </div>
    )
  }

  return (
    <div className="people-page" data-layout={breakpoint}>
      <div className={isDesktop ? 'people-top-bar' : 'people-sticky-controls'}>
        {isDesktop ? (
          <div className="d-toolbar">
            <div className="toolbar-row">
              <SearchField
                value={searchDraft}
                onChange={setSearchDraft}
                placeholder="Search by name…"
              />
              <SortControls
                sort={filters.sort}
                order={filters.order}
                onSortChange={setSort}
              />
            </div>
          </div>
        ) : (
          <div className="m-search-toolbar">
            <SearchField
              variant="mobile"
              value={searchDraft}
              onChange={setSearchDraft}
              placeholder="Search people"
            />
            <div className="m-toolbar-actions">
              <FilterToolbarButton
                activeCount={activeFilterCount}
                onClick={() => setFilterSheetOpen(true)}
              />
              <SortControls
                sort={filters.sort}
                order={filters.order}
                onSortChange={setSort}
                iconOnly
              />
            </div>
          </div>
        )}
        <ActiveFilterChips
          filters={filters}
          onRemoveNationality={toggleNationality}
          onRemoveHobby={toggleHobby}
          onClearSearch={clearSearch}
          onClearAll={clearAll}
        />
      </div>

      <div className="people-main">
        {isDesktop ? (
          <div className="people-filters-column scrollbar-thin">
            <FilterSidebar
              facets={facets}
              selectedNationalities={filters.nationalities}
              selectedHobbies={filters.hobbies}
              onToggleNationality={toggleNationality}
              onToggleHobby={toggleHobby}
              loading={isBootstrapping}
            />
          </div>
        ) : null}

        <div className="people-scroll scrollbar-thin" ref={scrollRef}>
          {insightsSection}
          {loadMoreErrorBanner}
          <div className="people-list-pane">{listContent}</div>
        </div>
      </div>

      {!isDesktop ? (
        <MobileFilterSheet
          open={filterSheetOpen}
          facets={facets}
          selectedNationalities={filters.nationalities}
          selectedHobbies={filters.hobbies}
          resultCount={total}
          onClose={() => setFilterSheetOpen(false)}
          onToggleNationality={toggleNationality}
          onToggleHobby={toggleHobby}
          onClearAll={clearAll}
        />
      ) : null}
    </div>
  )
}
