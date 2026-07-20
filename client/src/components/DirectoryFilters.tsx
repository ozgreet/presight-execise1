import { useCallback, useEffect, useRef, useState } from 'react';

import type { FacetValue } from '../api/users';
import { FilterOption } from './FilterOption';
import { SelectedFilterChips } from './SelectedFilterChips';

type DirectoryFiltersProps = {
  hobbies: FacetValue[];
  isError: boolean;
  isLoading: boolean;
  nationalities: FacetValue[];
  onClear: () => void;
  onHobbiesChange: (hobbies: string[]) => void;
  onNationalitiesChange: (nationalities: string[]) => void;
  onRetry: () => void;
  selectedHobbies: string[];
  selectedNationalities: string[];
};

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

export function DirectoryFilters({
  hobbies,
  isError,
  isLoading,
  nationalities,
  onClear,
  onHobbiesChange,
  onNationalitiesChange,
  onRetry,
  selectedHobbies,
  selectedNationalities,
}: DirectoryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const selectedCount = selectedHobbies.length + selectedNationalities.length;
  const closeFilters = useCallback(() => {
    setIsOpen(false);
    filterTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFilters();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements =
          sidebarRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
        const firstElement = focusableElements?.[0];
        const lastElement = focusableElements?.[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
          return;
        }

        if (
          event.shiftKey &&
          (document.activeElement === firstElement ||
            !sidebarRef.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          lastElement.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === lastElement ||
            !sidebarRef.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeFilters, isOpen]);

  const removeHobby = (hobby: string) => {
    onHobbiesChange(selectedHobbies.filter((value) => value !== hobby));
  };
  const removeNationality = (nationality: string) => {
    onNationalitiesChange(
      selectedNationalities.filter((value) => value !== nationality),
    );
  };

  return (
    <>
      <SelectedFilterChips
        hobbies={selectedHobbies}
        nationalities={selectedNationalities}
        onClear={onClear}
        onRemoveHobby={removeHobby}
        onRemoveNationality={removeNationality}
      />

      <button
        aria-controls="directory-filter-sidebar"
        aria-expanded={isOpen}
        className="mobile-filter-trigger"
        onClick={() => setIsOpen(true)}
        ref={filterTriggerRef}
        type="button"
      >
        <span>Filters</span>
        {selectedCount > 0 && (
          <span aria-hidden="true" className="mobile-filter-count">
            {selectedCount}
          </span>
        )}
      </button>

      <button
        aria-label="Dismiss filters"
        className={`filter-overlay ${isOpen ? 'filter-overlay--open' : ''}`}
        onClick={closeFilters}
        type="button"
      />

      <aside
        aria-label="Directory filters"
        aria-modal={isOpen || undefined}
        className={`filter-sidebar ${isOpen ? 'filter-sidebar--open' : ''}`}
        id="directory-filter-sidebar"
        ref={sidebarRef}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="filter-sidebar__header">
          <div>
            <h2>Filters</h2>
            <p>Refine the current result set</p>
          </div>
          <button
            className="mobile-filter-close"
            onClick={closeFilters}
            ref={closeButtonRef}
            type="button"
          >
            Close filters
          </button>
        </div>

        {isLoading && (
          <div
            aria-label="Loading filter options"
            className="filter-loading"
            role="status"
          >
            <span className="sr-only">Loading filter options</span>
            {Array.from({ length: 10 }, (_, index) => (
              <span className="filter-loading__row" key={index}>
                <span />
                <span />
              </span>
            ))}
          </div>
        )}
        {isError && (
          <div className="state-panel state-panel--compact" role="alert">
            <strong>Filters unavailable</strong>
            <p>We could not refresh the available filter values.</p>
            <button onClick={onRetry} type="button">
              Retry filters
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <fieldset className="filter-group">
              <legend>Hobbies</legend>
              {hobbies.slice(0, 20).map(({ value, count }) => (
                <FilterOption
                  checked={selectedHobbies.includes(value)}
                  count={count}
                  key={value}
                  name={value}
                  onChange={() =>
                    onHobbiesChange(toggleValue(selectedHobbies, value))
                  }
                />
              ))}
              {hobbies.length === 0 && (
                <p className="filter-group__empty">No hobbies available</p>
              )}
            </fieldset>

            <fieldset className="filter-group">
              <legend>Nationalities</legend>
              {nationalities.slice(0, 20).map(({ value, count }) => (
                <FilterOption
                  checked={selectedNationalities.includes(value)}
                  count={count}
                  key={value}
                  name={value}
                  onChange={() =>
                    onNationalitiesChange(
                      toggleValue(selectedNationalities, value),
                    )
                  }
                />
              ))}
              {nationalities.length === 0 && (
                <p className="filter-group__empty">
                  No nationalities available
                </p>
              )}
            </fieldset>
          </>
        )}
      </aside>
    </>
  );
}
