import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '../api/users';
import { VirtualizedUserList } from './VirtualizedUserList';

const virtualState = vi.hoisted(() => ({
  indices: [] as number[],
}));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(
    (options: {
      count: number;
      getItemKey: (index: number) => number | string;
    }) => ({
      getTotalSize: () => options.count * 164,
      getVirtualItems: () =>
        virtualState.indices
          .filter((index) => index < options.count)
          .map((index) => ({
            end: (index + 1) * 164,
            index,
            key: options.getItemKey(index),
            lane: 0,
            size: 164,
            start: index * 164,
          })),
      measureElement: vi.fn(),
      scrollToOffset: vi.fn(),
    }),
  ),
}));

function createUser(id: number): User {
  return {
    id,
    avatar: `/avatar-${id}.svg`,
    first_name: `User${id}`,
    last_name: 'Example',
    age: 20 + id,
    nationality: 'Canada',
    hobbies: [],
  };
}

function renderList(
  overrides: Partial<ComponentProps<typeof VirtualizedUserList>> = {},
) {
  const props: ComponentProps<typeof VirtualizedUserList> = {
    fetchNextPage: vi.fn().mockResolvedValue(undefined),
    hasNextPage: false,
    initialError: false,
    isFetchingNextPage: false,
    isInitialLoading: false,
    loadedPageCount: 1,
    nextPageError: false,
    queryKey: '',
    retryInitial: vi.fn(),
    users: [createUser(1)],
    ...overrides,
  };

  return { ...render(<VirtualizedUserList {...props} />), props };
}

beforeEach(() => {
  virtualState.indices = [0, 1];
});

describe('VirtualizedUserList', () => {
  it('shows the initial loading state', () => {
    renderList({ isInitialLoading: true, users: [] });

    expect(screen.getByRole('status')).toHaveTextContent('Loading users');
  });

  it('shows the empty state', () => {
    renderList({ users: [] });

    expect(
      screen.getByText('No users match the current search and filters.'),
    ).toBeInTheDocument();
  });

  it('shows a recoverable initial error', () => {
    const retryInitial = vi.fn();
    renderList({ initialError: true, retryInitial, users: [] });

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load users.',
    );
    expect(retryInitial).toHaveBeenCalledOnce();
  });

  it('loads the next page when the last rows become visible', async () => {
    const fetchNextPage = vi.fn().mockResolvedValue(undefined);
    const users = Array.from({ length: 10 }, (_, index) =>
      createUser(index + 1),
    );
    virtualState.indices = [8, 9, 10];

    renderList({ fetchNextPage, hasNextPage: true, users });

    await waitFor(() => {
      expect(fetchNextPage).toHaveBeenCalledOnce();
    });
  });

  it('does not load after the final page', async () => {
    const fetchNextPage = vi.fn().mockResolvedValue(undefined);
    const users = Array.from({ length: 10 }, (_, index) =>
      createUser(index + 1),
    );
    virtualState.indices = [8, 9, 10];

    renderList({ fetchNextPage, hasNextPage: false, users });

    await waitFor(() => {
      expect(screen.getByText('You’ve reached the end')).toBeInTheDocument();
    });
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does not request another page while one is active', () => {
    const fetchNextPage = vi.fn().mockResolvedValue(undefined);
    const users = Array.from({ length: 10 }, (_, index) =>
      createUser(index + 1),
    );
    virtualState.indices = [8, 9, 10];

    renderList({
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: true,
      users,
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Loading more users');
  });

  it('shows a recoverable next-page error', () => {
    const fetchNextPage = vi.fn().mockResolvedValue(undefined);

    renderList({
      fetchNextPage,
      hasNextPage: true,
      nextPageError: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry loading more' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load more users.',
    );
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it('does not render duplicate user ids', () => {
    virtualState.indices = [0, 1, 2];

    renderList({
      users: [createUser(1), createUser(1), createUser(2)],
    });

    expect(document.querySelectorAll('[data-user-id="1"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-user-id="2"]')).toHaveLength(1);
  });
});
