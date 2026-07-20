import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { User } from '../api/users';
import { UserCard } from './UserCard';

function createUser(hobbies: string[]): User {
  return {
    id: 1,
    avatar: '/avatar.svg',
    first_name: 'Ana',
    last_name: 'Silva',
    age: 34,
    nationality: 'Brazil',
    hobbies,
  };
}

describe('UserCard', () => {
  it('shows at most two hobbies', () => {
    render(
      <UserCard user={createUser(['Chess', 'Cooking', 'Reading', 'Yoga'])} />,
    );

    expect(screen.getByText('Chess')).toBeInTheDocument();
    expect(screen.getByText('Cooking')).toBeInTheDocument();
    expect(screen.queryByText('Reading')).not.toBeInTheDocument();
    expect(screen.queryByText('Yoga')).not.toBeInTheDocument();
  });

  it('shows the number of additional hobbies', () => {
    render(
      <UserCard user={createUser(['Chess', 'Cooking', 'Reading', 'Yoga'])} />,
    );

    expect(screen.getByLabelText('2 more hobbies')).toHaveTextContent('+2');
  });

  it('handles an empty hobby list', () => {
    render(<UserCard user={createUser([])} />);

    expect(screen.getByText('No hobbies listed')).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('replaces a broken avatar with initials', () => {
    render(<UserCard user={createUser([])} />);

    fireEvent.error(screen.getByAltText('Ana Silva avatar'));

    expect(
      screen.getByRole('img', { name: 'Ana Silva avatar unavailable' }),
    ).toHaveTextContent('AS');
  });
});
