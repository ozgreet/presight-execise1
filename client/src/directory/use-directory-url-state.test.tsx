import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useDirectoryUrlState } from './use-directory-url-state';

function UrlStateHarness() {
  const { state, clearFilters, setHobbies, setSort, setTextQuery } =
    useDirectoryUrlState();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <output aria-label="state">{JSON.stringify(state)}</output>
      <output aria-label="search">{location.search}</output>
      <button
        onClick={() => setHobbies((values) => [...values, 'Chess'])}
        type="button"
      >
        Add hobby
      </button>
      <button onClick={() => setSort('age')} type="button">
        Sort by age
      </button>
      <button onClick={() => setTextQuery('Ana Silva')} type="button">
        Set query
      </button>
      <button onClick={clearFilters} type="button">
        Clear filters
      </button>
      <button onClick={() => void navigate(-1)} type="button">
        Back
      </button>
      <button onClick={() => void navigate(1)} type="button">
        Forward
      </button>
    </>
  );
}

function renderHarness(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <UrlStateHarness />
    </MemoryRouter>,
  );
}

describe('useDirectoryUrlState', () => {
  it('restores controls from the initial URL', () => {
    renderHarness(
      '/?q=Ana&hobbies=Chess&nationalities=Brazil&sort=age&direction=desc',
    );

    expect(screen.getByLabelText('state')).toHaveTextContent(
      JSON.stringify({
        q: 'Ana',
        hobbies: ['Chess'],
        nationalities: ['Brazil'],
        sort: 'age',
        direction: 'desc',
      }),
    );
  });

  it('updates the URL immediately for text while replacing history', async () => {
    renderHarness('/?hobbies=Chess');

    fireEvent.click(screen.getByRole('button', { name: 'Set query' }));

    await waitFor(() => {
      expect(screen.getByLabelText('search')).toHaveTextContent(
        '?q=Ana+Silva&hobbies=Chess',
      );
    });
  });

  it('responds to browser back and forward navigation', async () => {
    renderHarness('/?q=Ana');

    fireEvent.click(screen.getByRole('button', { name: 'Add hobby' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sort by age' }));

    await waitFor(() => {
      expect(screen.getByLabelText('search')).toHaveTextContent(
        '?q=Ana&hobbies=Chess&sort=age',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(screen.getByLabelText('search')).toHaveTextContent(
        '?q=Ana&hobbies=Chess',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(screen.getByLabelText('search')).toHaveTextContent('?q=Ana');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Forward' }));

    await waitFor(() => {
      expect(screen.getByLabelText('search')).toHaveTextContent(
        '?q=Ana&hobbies=Chess',
      );
    });
  });

  it('clears both filter groups without changing search or sort', async () => {
    renderHarness(
      '/?q=Ana&hobbies=Chess&nationalities=Brazil&sort=age&direction=desc',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(screen.getByLabelText('search')).toHaveTextContent(
        '?q=Ana&sort=age&direction=desc',
      );
    });
  });
});
