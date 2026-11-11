import type { CSSProperties } from 'react'

const NODES = [
  { x: '8%', y: '34%', delay: '0s', duration: '4.8s' },
  { x: '22%', y: '62%', delay: '0.6s', duration: '5.4s' },
  { x: '41%', y: '28%', delay: '1.2s', duration: '4.2s' },
  { x: '58%', y: '70%', delay: '0.3s', duration: '5.8s' },
  { x: '74%', y: '38%', delay: '1.8s', duration: '4.6s' },
  { x: '88%', y: '58%', delay: '0.9s', duration: '5.2s' },
] as const

export function HeaderPeopleAmbient() {
  return (
    <div className="header-signal-ambient" aria-hidden="true">
      <div className="header-scanline" />
      <div className="header-signal-grid" />
      {NODES.map((node, index) => (
        <span
          key={index}
          className="header-signal-node"
          style={
            {
              '--x': node.x,
              '--y': node.y,
              '--delay': node.delay,
              '--duration': node.duration,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function DirectoryHeaderBrand() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg className="brand-mark-scene" viewBox="0 0 36 36">
        <circle className="brand-ring brand-ring-outer" cx="18" cy="18" r="13.5" />
        <circle className="brand-ring brand-ring-mid" cx="18" cy="18" r="9" />
        <path
          className="brand-arc"
          d="M18 4.5a13.5 13.5 0 0 1 13.5 13.5"
          fill="none"
        />
        <path
          className="brand-arc brand-arc-secondary"
          d="M18 31.5a13.5 13.5 0 0 1-13.5-13.5"
          fill="none"
        />
        <line className="brand-cross" x1="18" y1="8" x2="18" y2="28" />
        <line className="brand-cross" x1="8" y1="18" x2="28" y2="18" />
        <circle className="brand-hub" cx="18" cy="18" r="2.4" />
        <circle className="brand-hub-core" cx="18" cy="18" r="1" />
      </svg>
    </div>
  )
}
