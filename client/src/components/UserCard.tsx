import { useState } from 'react';

import type { User } from '../api/users';

type UserCardProps = {
  user: User;
};

export function UserCard({ user }: UserCardProps) {
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const avatarFailed = failedAvatar === user.avatar;
  const fullName = `${user.first_name} ${user.last_name}`;
  const initials =
    `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  const visibleHobbies = user.hobbies.slice(0, 2);
  const remainingHobbies = Math.max(0, user.hobbies.length - 2);
  const headingId = `user-${user.id}-name`;

  return (
    <article
      aria-labelledby={headingId}
      className="user-card"
      data-user-id={user.id}
    >
      {avatarFailed ? (
        <div
          aria-label={`${fullName} avatar unavailable`}
          className="user-card__avatar-fallback"
          role="img"
        >
          {initials}
        </div>
      ) : (
        <img
          alt={`${fullName} avatar`}
          className="user-card__avatar"
          height="56"
          loading="lazy"
          onError={() => setFailedAvatar(user.avatar)}
          src={user.avatar}
          width="56"
        />
      )}

      <div className="user-card__content">
        <h2 id={headingId} title={fullName}>
          {fullName}
        </h2>
        <p className="user-card__meta">
          <span className="user-card__nationality" title={user.nationality}>
            {user.nationality}
          </span>
          <span aria-hidden="true" className="user-card__separator">
            ·
          </span>
          <span aria-label={`Age ${user.age}`}>{user.age} years old</span>
        </p>

        {visibleHobbies.length > 0 ? (
          <ul aria-label={`${fullName} hobbies`} className="user-card__hobbies">
            {visibleHobbies.map((hobby) => (
              <li key={hobby} title={hobby}>
                {hobby}
              </li>
            ))}
            {remainingHobbies > 0 && (
              <li
                aria-label={`${remainingHobbies} more hobbies`}
                className="user-card__more"
              >
                +{remainingHobbies}
              </li>
            )}
          </ul>
        ) : (
          <p className="user-card__empty-hobbies">No hobbies listed</p>
        )}
      </div>
    </article>
  );
}
