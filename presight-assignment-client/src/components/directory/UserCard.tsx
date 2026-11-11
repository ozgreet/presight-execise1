import { useEffect, useId, useRef, useState } from 'react'
import type { User } from '../../types/api'
import { NationalityFlag } from './NationalityFlag'
import { getUserDisplayName, getUserInitials } from './utils'

type UserCardProps = {
  user: User
}

const VISIBLE_HOBBY_COUNT = 2
const HOVER_CLOSE_DELAY_MS = 120

function UserAvatar({ user }: { user: User }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const initials = getUserInitials(user)

  useEffect(() => {
    setStatus('loading')
  }, [user.avatar])

  const handleImageRef = (image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) {
      setStatus('loaded')
    }
  }

  return (
    <div className="avatar-wrap">
      <div
        className={`avatar-fallback${status === 'loaded' ? ' is-hidden' : ''}`}
        aria-hidden="true"
      >
        {initials}
      </div>
      {status !== 'error' ? (
        <img
          ref={handleImageRef}
          className={`avatar-image${status === 'loaded' ? ' is-loaded' : ''}`}
          src={user.avatar}
          alt=""
          loading="lazy"
          decoding="async"
          width={54}
          height={54}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      ) : null}
      <NationalityFlag
        nationality={user.nationality}
        className="avatar-flag"
      />
    </div>
  )
}

function HobbyOverflowPopover({ hobbies }: { hobbies: string[] }) {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const popoverId = useId()

  const show = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(true)
  }

  const hide = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      closeTimerRef.current = null
    }, HOVER_CLOSE_DELAY_MS)
  }

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    },
    [],
  )

  if (hobbies.length === 0) {
    return null
  }

  return (
    <div className="hobby-overflow" onMouseEnter={show} onMouseLeave={hide}>
      <span className="plus-badge" aria-describedby={open ? popoverId : undefined}>
        +{hobbies.length}
      </span>
      {open ? (
        <div className="hobby-popover" id={popoverId} role="tooltip">
          <div className="hobby-popover-title">More hobbies</div>
          <div className="hobby-popover-list">
            {hobbies.map((hobby) => (
              <span className="hobby-chip" key={hobby}>
                {hobby}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function UserCard({ user }: UserCardProps) {
  const visibleHobbies = user.hobbies.slice(0, VISIBLE_HOBBY_COUNT)
  const hiddenHobbies = user.hobbies.slice(VISIBLE_HOBBY_COUNT)

  return (
    <article className="ucard">
      <div className="top">
        <UserAvatar user={user} />
        <div className="ucard-details">
          <div className="name">{getUserDisplayName(user)}</div>
          <div className="profession">{user.profession}</div>
          <div className="meta">
            {user.nationality} · {user.age} yrs
          </div>
        </div>
      </div>
      <div className="hobbies">
        {visibleHobbies.map((hobby) => (
          <span className="hobby-chip" key={hobby}>
            {hobby}
          </span>
        ))}
        <HobbyOverflowPopover hobbies={hiddenHobbies} />
      </div>
    </article>
  )
}

export function UserCardSkeleton() {
  return (
    <article className="ucard skeleton-card" aria-hidden="true">
      <div className="top">
        <div className="skel avatar-skel" />
        <div className="ucard-details skeleton-lines">
          <div className="skel line-lg" />
          <div className="skel line-sm" />
          <div className="skel line-sm short" />
        </div>
      </div>
      <div className="skeleton-chips">
        <div className="skel chip-skel" />
        <div className="skel chip-skel short" />
      </div>
    </article>
  )
}
