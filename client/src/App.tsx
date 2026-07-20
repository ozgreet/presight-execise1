import { DirectoryFilters } from './components/DirectoryFilters';
import { SortControls } from './components/SortControls';
import { VirtualizedUserList } from './components/VirtualizedUserList';
import { directoryStateKey } from './directory/directory-state';
import { useDirectoryQueries } from './directory/use-directory-queries';
import { useDirectoryUrlState } from './directory/use-directory-url-state';

export function App() {
  const {
    state,
    clearFilters,
    setTextQuery,
    setHobbies,
    setNationalities,
    setSort,
    setDirection,
  } = useDirectoryUrlState();
  const { usersQuery, users, facetsQuery, isSearchPending } =
    useDirectoryQueries(state);

  return (
    <main className="directory-page">
      <header className="directory-header">
        <div>
          <p className="directory-eyebrow">People</p>
          <h1>User directory</h1>
          <p className="directory-subtitle">
            Search and explore people across teams and interests.
          </p>
        </div>

        <div className="directory-controls">
          <form
            className="search-control"
            onSubmit={(event) => event.preventDefault()}
            role="search"
          >
            <label>
              <span>Search by name</span>
              <input
                aria-label="Search users"
                autoComplete="off"
                onChange={(event) => setTextQuery(event.target.value)}
                placeholder="Search first or last name"
                type="search"
                value={state.q}
              />
            </label>
          </form>

          <SortControls
            direction={state.direction}
            field={state.sort}
            onDirectionChange={setDirection}
            onFieldChange={setSort}
          />
        </div>
      </header>

      <div className="directory-layout">
        <DirectoryFilters
          hobbies={facetsQuery.data?.hobbies ?? []}
          isError={facetsQuery.isError}
          isLoading={facetsQuery.isPending}
          nationalities={facetsQuery.data?.nationalities ?? []}
          onClear={clearFilters}
          onHobbiesChange={setHobbies}
          onNationalitiesChange={setNationalities}
          onRetry={() => void facetsQuery.refetch()}
          selectedHobbies={state.hobbies}
          selectedNationalities={state.nationalities}
        />

        <section aria-label="Directory results" className="directory-results">
          <header className="results-header">
            <div>
              <h2>Directory results</h2>
              <p aria-live="polite">
                {isSearchPending
                  ? 'Updating results…'
                  : users.length > 0
                    ? `${users.length} users loaded`
                    : 'Ready to browse'}
              </p>
            </div>
          </header>
          <VirtualizedUserList
            fetchNextPage={usersQuery.fetchNextPage}
            hasNextPage={Boolean(usersQuery.hasNextPage)}
            initialError={
              usersQuery.isError &&
              !usersQuery.isFetchNextPageError &&
              users.length === 0
            }
            isFetchingNextPage={usersQuery.isFetchingNextPage}
            isInitialLoading={
              users.length === 0 && (usersQuery.isPending || isSearchPending)
            }
            loadedPageCount={usersQuery.data?.pages.length ?? 0}
            nextPageError={usersQuery.isFetchNextPageError}
            queryKey={directoryStateKey(state)}
            retryInitial={() => void usersQuery.refetch()}
            users={users}
          />
        </section>
      </div>
    </main>
  );
}
