import type { CSSProperties } from 'react'
import { useLayoutEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { User } from '../../types/api'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { UserCard, UserCardSkeleton } from './UserCard'

type UserListProps = {
  scrollElement: HTMLElement | null
  users: User[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
  columns?: 1 | 2 | 3
}

const ROW_HEIGHT = 168
const INITIAL_SKELETON_COUNT = 4

function LoadingSkeletons({ columns }: { columns: number }) {
  const count = columns === 1 ? INITIAL_SKELETON_COUNT : columns * 3

  if (columns === 1) {
    return (
      <div className="user-list user-list-single">
        {Array.from({ length: count }).map((_, index) => (
          <UserCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="user-list user-list-grid"
      style={{ '--grid-columns': columns } as CSSProperties}
    >
      <div className="loading-grid">
        {Array.from({ length: count }).map((_, index) => (
          <UserCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

function SingleColumnUserList({
  scrollElement,
  users,
  loadingMore,
  hasMore,
  onLoadMore,
  loading,
}: Omit<UserListProps, 'columns'>) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useInfiniteScroll({
    scrollElement,
    sentinelRef,
    enabled: !loading,
    hasMore,
    loading,
    loadingMore,
    onLoadMore,
    itemCount: users.length,
  })

  return (
    <div className="user-list user-list-single">
      {users.map((user) => (
        <UserCard user={user} key={user.id} />
      ))}
      <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
      {loadingMore ? (
        <div className="loading-more-list">
          <UserCardSkeleton />
        </div>
      ) : null}
      {!loadingMore && hasMore ? (
        <div className="grid-footer">Scroll to load more</div>
      ) : null}
    </div>
  )
}

function GridUserList({
  scrollElement,
  users,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  columns,
}: Required<
  Pick<
    UserListProps,
    | 'scrollElement'
    | 'users'
    | 'loading'
    | 'loadingMore'
    | 'hasMore'
    | 'onLoadMore'
    | 'columns'
  >
>) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const rowCount = Math.ceil(users.length / columns) || 0

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
    getItemKey: (index) => {
      const startIndex = index * columns
      const rowUsers = users.slice(startIndex, startIndex + columns)
      return rowUsers.map((user) => user.id).join('-') || index
    },
  })

  useLayoutEffect(() => {
    if (!scrollElement) {
      return
    }

    scrollElement.scrollTop = 0
    virtualizer.scrollToOffset(0)
    // Remounted via filter key from PeoplePage; only reset once per list instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only reset
  }, [scrollElement])

  useInfiniteScroll({
    scrollElement,
    sentinelRef,
    enabled: !loading,
    hasMore,
    loading,
    loadingMore,
    onLoadMore,
    itemCount: users.length,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      className="user-list user-list-grid"
      style={{ '--grid-columns': columns } as CSSProperties}
    >
      <div
        className="virtual-grid"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * columns
          const rowUsers = users.slice(startIndex, startIndex + columns)

          return (
            <div
              className="virtual-row"
              key={virtualRow.key}
              data-index={virtualRow.index}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowUsers.map((user) => (
                <UserCard user={user} key={user.id} />
              ))}
            </div>
          )
        })}
      </div>
      <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
      {loadingMore ? (
        <div className="loading-more-grid">
          {Array.from({ length: columns }).map((_, index) => (
            <UserCardSkeleton key={index} />
          ))}
        </div>
      ) : null}
      <div className="grid-footer">
        {hasMore && !loadingMore
          ? 'Scroll to load more'
          : !hasMore && users.length > 0
            ? "You've reached the end of the directory"
            : null}
      </div>
    </div>
  )
}

export function UserList({
  scrollElement,
  users,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  columns = 3,
}: UserListProps) {
  if (loading) {
    return <LoadingSkeletons columns={columns} />
  }

  if (columns === 1) {
    return (
      <SingleColumnUserList
        scrollElement={scrollElement}
        users={users}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
    )
  }

  return (
    <GridUserList
      scrollElement={scrollElement}
      users={users}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      columns={columns}
    />
  )
}
