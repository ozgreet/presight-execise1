import { describe, expect, it } from 'vitest';

import {
  defaultDirectoryState,
  parseDirectoryState,
  serializeDirectoryState,
  type DirectoryState,
} from './directory-state';

describe('directory URL state', () => {
  it('parses all supported values', () => {
    const state = parseDirectoryState(
      new URLSearchParams(
        'q=Ana+Silva&hobbies=Yoga&hobbies=Chess&nationalities=Spain&nationalities=Brazil&sort=age&direction=desc',
      ),
    );

    expect(state).toEqual({
      q: 'Ana Silva',
      hobbies: ['Chess', 'Yoga'],
      nationalities: ['Brazil', 'Spain'],
      sort: 'age',
      direction: 'desc',
    });
  });

  it('supports comma-separated values and removes duplicates', () => {
    const state = parseDirectoryState(
      new URLSearchParams(
        'hobbies=Yoga%2CChess&hobbies=yoga&nationalities=Spain%2CBrazil',
      ),
    );

    expect(state.hobbies).toEqual(['Chess', 'yoga']);
    expect(state.nationalities).toEqual(['Brazil', 'Spain']);
  });

  it('falls back safely for invalid values', () => {
    const state = parseDirectoryState(
      new URLSearchParams(
        `q=${'a'.repeat(101)}&sort=invalid&direction=sideways&hobbies=${'b'.repeat(101)}`,
      ),
    );

    expect(state).toEqual(defaultDirectoryState);
  });

  it('serializes filters in deterministic order and omits defaults', () => {
    const state: DirectoryState = {
      q: 'Ana Silva',
      hobbies: ['Yoga', 'Chess'],
      nationalities: ['Spain', 'Brazil'],
      sort: 'last_name',
      direction: 'asc',
    };

    expect(serializeDirectoryState(state).toString()).toBe(
      'q=Ana+Silva&hobbies=Chess&hobbies=Yoga&nationalities=Brazil&nationalities=Spain',
    );
  });

  it('round-trips shareable state', () => {
    const state: DirectoryState = {
      q: 'Mei Tanaka',
      hobbies: ['Reading', 'Travel'],
      nationalities: ['Japan'],
      sort: 'nationality',
      direction: 'desc',
    };

    expect(parseDirectoryState(serializeDirectoryState(state))).toEqual(state);
  });
});
