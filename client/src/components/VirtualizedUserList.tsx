import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef } from 'react';

import type { User } from '../api/users';
import { UserCard } from './UserCard';

type VirtualizedUserListProps = {
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  initialError: boolean;
  isFetchingNextPage: boolean;
  isInitialLoading: boolean;
  loadedPageCount: number;
  nextPageError: boolean;
  queryKey: string;
  retryInitial: () => void;
  users: User[];
};

function uniqueUsers(users: User[]): User[] {
  const usersById = new Map<number, User>();

  for (const user of users) {
    if (!usersById.has(user.id)) {
      usersById.set(user.id, user);
    }
  }

  return [...usersById.values()];
}

export function VirtualizedUserList({
  fetchNextPage,
  hasNextPage,
  initialError,
  isFetchingNextPage,
  isInitialLoading,
  loadedPageCount,
  nextPageError,
  queryKey,
  retryInitial,
  users,
}: VirtualizedUserListProps) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const loadRequestKeyRef = useRef<string | null>(null);
  const deduplicatedUsers = useMemo(() => uniqueUsers(users), [users]);
  const statusIndex = deduplicatedUsers.length;
  const virtualizer = useVirtualizer({
    count: deduplicatedUsers.length + 1,
    estimateSize: (index) => (index === statusIndex ? 68 : 132),
    getItemKey: (index) =>
      index === statusIndex
        ? 'directory-status'
        : (deduplicatedUsers[index]?.id ?? `missing-${index}`),
    getScrollElement: () => scrollElementRef.current,
    initialRect: { height: 600, width: 0 },
    overscan: 5,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const lastVirtualIndex = virtualItems.at(-1)?.index ?? -1;

  useEffect(() => {
    loadRequestKeyRef.current = null;

    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
    }

    virtualizer.scrollToOffset(0);
  }, [queryKey, virtualizer]);

  useEffect(() => {
    const loadRequestKey = `${queryKey}:${loadedPageCount}`;
    const isNearEnd =
      lastVirtualIndex >= Math.max(0, deduplicatedUsers.length - 5);

    if (
      isNearEnd &&
      hasNextPage &&
      !isFetchingNextPage &&
      !nextPageError &&
      loadRequestKeyRef.current !== loadRequestKey
    ) {
      loadRequestKeyRef.current = loadRequestKey;
      void fetchNextPage();
    }
  }, [
    deduplicatedUsers.length,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    lastVirtualIndex,
    loadedPageCount,
    nextPageError,
    queryKey,
  ]);

  const retryNextPage = () => {
    loadRequestKeyRef.current = null;
    void fetchNextPage();
  };

  if (isInitialLoading) {
    return (
      <div
        aria-label="Loading users"
        className="user-list user-list--loading"
        role="status"
      >
        <span className="sr-only">Loading users</span>
        <div className="user-skeletons">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="user-skeleton" key={index}>
              <span className="user-skeleton__avatar" />
              <span className="user-skeleton__content">
                <span />
                <span />
                <span />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="state-panel" role="alert">
        <span aria-hidden="true" className="state-panel__icon">
          !
        </span>
        <strong>Unable to load users.</strong>
        <p>Check your connection and try loading the directory again.</p>
        <button onClick={retryInitial} type="button">
          Try again
        </button>
      </div>
    );
  }

  if (deduplicatedUsers.length === 0) {
    return (
      <div className="state-panel">
        <span aria-hidden="true" className="state-panel__icon">
          0
        </span>
        <strong>No users found</strong>
        <p>No users match the current search and filters.</p>
      </div>
    );
  }

  return (
    <div
      aria-label="User results"
      aria-busy={isFetchingNextPage}
      className="user-list"
      ref={scrollElementRef}
      role="list"
    >
      <div
        className="user-list__content"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => {
          const user = deduplicatedUsers[virtualItem.index];
          const isStatus = virtualItem.index === statusIndex;

          return (
            <div
              className="user-list__row"
              data-index={virtualItem.index}
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              role="listitem"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {user && <UserCard user={user} />}
              {isStatus && isFetchingNextPage && (
                <p className="list-status" role="status">
                  <span aria-hidden="true" className="loading-indicator" />
                  Loading more users
                </p>
              )}
              {isStatus && nextPageError && (
                <div className="list-status list-status--error" role="alert">
                  <p>Unable to load more users.</p>
                  <button onClick={retryNextPage} type="button">
                    Retry loading more
                  </button>
                </div>
              )}
              {isStatus &&
                !hasNextPage &&
                !isFetchingNextPage &&
                !nextPageError && (
                  <p className="list-status">You’ve reached the end</p>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
