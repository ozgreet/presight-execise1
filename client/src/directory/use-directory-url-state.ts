import {
  useCallback,
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  directoryStateKey,
  parseDirectoryState,
  serializeDirectoryState,
  type DirectoryState,
  type SortDirection,
  type SortField,
} from './directory-state';

type DirectoryUrlState = {
  clearFilters: () => void;
  setDirection: (direction: SortDirection) => void;
  setHobbies: Dispatch<SetStateAction<string[]>>;
  setNationalities: Dispatch<SetStateAction<string[]>>;
  setSort: (sort: SortField) => void;
  setTextQuery: (query: string) => void;
  state: DirectoryState;
};

export function useDirectoryUrlState(): DirectoryUrlState {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(
    () => parseDirectoryState(searchParams),
    [searchParams],
  );
  const canonicalSearch = directoryStateKey(state);

  useEffect(() => {
    if (searchParams.toString() !== canonicalSearch) {
      setSearchParams(canonicalSearch, { replace: true });
    }
  }, [canonicalSearch, searchParams, setSearchParams]);

  const updateState = useCallback(
    (
      update: (currentState: DirectoryState) => DirectoryState,
      replace = false,
    ) => {
      setSearchParams(serializeDirectoryState(update(state)), { replace });
    },
    [setSearchParams, state],
  );

  const setTextQuery = useCallback(
    (q: string) => {
      updateState(
        (currentState) => ({ ...currentState, q: q.slice(0, 100) }),
        true,
      );
    },
    [updateState],
  );

  const setHobbies: Dispatch<SetStateAction<string[]>> = useCallback(
    (nextValue) => {
      updateState((currentState) => ({
        ...currentState,
        hobbies:
          typeof nextValue === 'function'
            ? nextValue(currentState.hobbies)
            : nextValue,
      }));
    },
    [updateState],
  );

  const setNationalities: Dispatch<SetStateAction<string[]>> = useCallback(
    (nextValue) => {
      updateState((currentState) => ({
        ...currentState,
        nationalities:
          typeof nextValue === 'function'
            ? nextValue(currentState.nationalities)
            : nextValue,
      }));
    },
    [updateState],
  );

  const setSort = useCallback(
    (sort: SortField) => {
      updateState((currentState) => ({ ...currentState, sort }));
    },
    [updateState],
  );

  const setDirection = useCallback(
    (direction: SortDirection) => {
      updateState((currentState) => ({ ...currentState, direction }));
    },
    [updateState],
  );

  const clearFilters = useCallback(() => {
    updateState((currentState) => ({
      ...currentState,
      hobbies: [],
      nationalities: [],
    }));
  }, [updateState]);

  return {
    state,
    clearFilters,
    setTextQuery,
    setHobbies,
    setNationalities,
    setSort,
    setDirection,
  };
}
