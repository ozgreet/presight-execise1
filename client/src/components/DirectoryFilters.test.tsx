import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { FacetValue } from '../api/users';
import { DirectoryFilters } from './DirectoryFilters';

const hobbies: FacetValue[] = [
  { value: 'Chess', count: 12 },
  { value: 'Reading', count: 8 },
];

const nationalities: FacetValue[] = [
  { value: 'Brazil', count: 10 },
  { value: 'Japan', count: 6 },
];

function renderFilters(
  overrides: Partial<ComponentProps<typeof DirectoryFilters>> = {},
) {
  const props: ComponentProps<typeof DirectoryFilters> = {
    hobbies,
    isError: false,
    isLoading: false,
    nationalities,
    onClear: vi.fn(),
    onHobbiesChange: vi.fn(),
    onNationalitiesChange: vi.fn(),
    onRetry: vi.fn(),
    selectedHobbies: [],
    selectedNationalities: [],
    ...overrides,
  };

  return { ...render(<DirectoryFilters {...props} />), props };
}

describe('DirectoryFilters', () => {
  it('selects and removes hobbies', () => {
    const onHobbiesChange = vi.fn();
    const { rerender, props } = renderFilters({ onHobbiesChange });

    fireEvent.click(screen.getByRole('checkbox', { name: /Chess/ }));
    expect(onHobbiesChange).toHaveBeenCalledWith(['Chess']);

    rerender(
      <DirectoryFilters
        {...props}
        onHobbiesChange={onHobbiesChange}
        selectedHobbies={['Chess']}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove hobby Chess' }));

    expect(onHobbiesChange).toHaveBeenLastCalledWith([]);
  });

  it('selects and removes nationalities', () => {
    const onNationalitiesChange = vi.fn();
    const { rerender, props } = renderFilters({
      onNationalitiesChange,
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Brazil/ }));
    expect(onNationalitiesChange).toHaveBeenCalledWith(['Brazil']);

    rerender(
      <DirectoryFilters
        {...props}
        onNationalitiesChange={onNationalitiesChange}
        selectedNationalities={['Brazil']}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove nationality Brazil' }),
    );

    expect(onNationalitiesChange).toHaveBeenLastCalledWith([]);
  });

  it('clears every selected filter', () => {
    const onClear = vi.fn();
    renderFilters({
      onClear,
      selectedHobbies: ['Chess'],
      selectedNationalities: ['Brazil'],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onClear).toHaveBeenCalledOnce();
  });

  it('displays readable facet counts', () => {
    renderFilters();

    expect(screen.getByLabelText('12 matching users')).toHaveTextContent('12');
    expect(screen.getByLabelText('10 matching users')).toHaveTextContent('10');
  });

  it('preserves selected values absent from the top options', () => {
    renderFilters({
      selectedHobbies: ['Rare hobby'],
      selectedNationalities: ['Atlantis'],
    });

    expect(
      screen.getByRole('button', { name: 'Remove hobby Rare hobby' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove nationality Atlantis' }),
    ).toBeInTheDocument();
  });

  it('opens and closes the mobile filter panel', () => {
    renderFilters();
    const openButton = screen.getByRole('button', { name: 'Filters' });

    expect(openButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(openButton);
    expect(openButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Close filters' }));
    expect(openButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps keyboard focus inside the open mobile filter panel', () => {
    renderFilters();
    const openButton = screen.getByRole('button', { name: 'Filters' });

    fireEvent.click(openButton);
    expect(
      screen.getByRole('dialog', { name: 'Directory filters' }),
    ).toHaveAttribute('aria-modal', 'true');

    openButton.focus();
    fireEvent.keyDown(window, { key: 'Tab' });

    expect(screen.getByRole('button', { name: 'Close filters' })).toHaveFocus();
  });

  it('shows facet loading and recoverable error states', () => {
    const onRetry = vi.fn();
    const { rerender, props } = renderFilters({ isLoading: true, onRetry });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading filter options',
    );

    rerender(
      <DirectoryFilters
        {...props}
        isError
        isLoading={false}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry filters' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Filters unavailable');
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
