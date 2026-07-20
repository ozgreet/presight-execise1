import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from './use-debounced-value';

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('delays the effective value and discards superseded updates', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'A' } },
    );

    rerender({ value: 'An' });
    rerender({ value: 'Ana' });

    expect(result.current).toBe('A');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('Ana');
  });
});
