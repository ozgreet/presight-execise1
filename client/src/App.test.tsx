import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(
    (options: {
      count: number;
      getItemKey: (index: number) => number | string;
    }) => ({
      getTotalSize: () => options.count * 164,
      getVirtualItems: () =>
        Array.from({ length: options.count }, (_, index) => ({
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('restores URL state and queries users and facets with it', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes('/facets')
        ? {
            hobbies: [{ value: 'Chess', count: 1 }],
            nationalities: [{ value: 'Brazil', count: 1 }],
          }
        : {
            users: [
              {
                id: 1,
                avatar: '/avatar.svg',
                first_name: 'Ana',
                last_name: 'Silva',
                age: 34,
                nationality: 'Brazil',
                hobbies: ['Chess'],
              },
            ],
            pagination: {
              limit: 40,
              hasMore: false,
              nextCursor: null,
            },
          };

      return Promise.resolve(
        new Response(JSON.stringify(body), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }),
      );
    });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('scrollTo', vi.fn());

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <MemoryRouter
        initialEntries={[
          '/?q=Ana&hobbies=Chess&nationalities=Brazil&sort=age&direction=desc',
        ]}
      >
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Search users')).toHaveValue('Ana');
    expect(screen.getByLabelText('Sort field')).toHaveValue('age');
    expect(screen.getByLabelText('Sort direction')).toHaveValue('desc');
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/api/users?q=Ana&hobbies=Chess&nationalities=Brazil&sort=age&direction=desc',
      ),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/api/users/facets?q=Ana&hobbies=Chess&nationalities=Brazil',
      ),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
