import { useEffect } from 'react'
import type { AgeBucketStat, FacetItem, InsightsOverview } from '../../types/api'

export function StatCard({
  value,
  label,
  loading,
}: {
  value: string | number
  label: string
  loading?: boolean
}) {
  return (
    <div className={`stat-card${loading ? ' stat-card-skeleton' : ''}`}>
      {loading ? (
        <>
          <div className="skel stat-value-skel" />
          <div className="skel stat-label-skel" />
        </>
      ) : (
        <>
          <div className="n">{value}</div>
          <div className="l">{label}</div>
        </>
      )}
    </div>
  )
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max > 0 ? (count / max) * 100 : 0

  return (
    <div className="bar-row">
      <span className="lbl">{label}</span>
      <span className="track">
        <span className="fill" style={{ width: `${width}%` }} />
      </span>
      <span className="val">{count}</span>
    </div>
  )
}

export function FacetBars({ title, items }: { title: string; items: FacetItem[] }) {
  const max = items[0]?.count ?? 1

  return (
    <div className="ins-panel">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="ins-empty">No data for the current filters.</p>
      ) : (
        items.map((item) => (
          <BarRow key={item.value} label={item.value} count={item.count} max={max} />
        ))
      )}
    </div>
  )
}

export function AgeHistogram({ buckets }: { buckets: AgeBucketStat[] }) {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1)

  return (
    <div className="ins-panel">
      <h3>Age distribution</h3>
      <div className="hist">
        {buckets.map((bucket) => (
          <div className="col" key={bucket.label}>
            <div
              className="bar"
              style={{ height: `${(bucket.count / max) * 120 || 2}px` }}
            />
            <div className="lbl">{bucket.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

type InsightsStatCardsProps = {
  overview: InsightsOverview | null
  loading: boolean
  onOpenDetails: () => void
}

export function InsightsStatCards({ overview, loading, onOpenDetails }: InsightsStatCardsProps) {
  const formatValue = (value: number | null) =>
    value === null ? '—' : value.toLocaleString()

  return (
    <section className="insights-strip" aria-label="Directory insights">
      <div className="insights-strip-head">
        <div>
          {loading ? (
            <>
              <div className="skel insights-eyebrow-skel" />
              <div className="skel insights-copy-skel" />
            </>
          ) : (
            <>
              <p className="eyebrow">Insights</p>
              <p className="insights-strip-copy">
                {overview?.filtered
                  ? 'Stats for your current search and filters.'
                  : 'Live stats across the full directory.'}
              </p>
            </>
          )}
        </div>
        {loading ? (
          <div className="skel insights-cta-skel" aria-hidden="true" />
        ) : (
          <button
            type="button"
            className="btn primary insights-cta"
            onClick={onOpenDetails}
            disabled={!overview}
          >
            View detailed insights
          </button>
        )}
      </div>
      <div className="stat-cards stat-cards-inline">
        <StatCard
          loading={loading}
          value={formatValue(overview?.totalPeople ?? null)}
          label={overview?.filtered ? 'People matching' : 'Total people'}
        />
        <StatCard
          loading={loading}
          value={formatValue(overview?.nationalityCount ?? null)}
          label="Nationalities"
        />
        <StatCard
          loading={loading}
          value={formatValue(overview?.hobbyCount ?? null)}
          label="Distinct hobbies"
        />
        <StatCard
          loading={loading}
          value={formatValue(overview?.medianAge ?? null)}
          label="Median age"
        />
      </div>
    </section>
  )
}

type InsightsDetailModalProps = {
  open: boolean
  overview: InsightsOverview | null
  loading: boolean
  error: string | null
  onClose: () => void
  onRetry: () => void
}

export function InsightsDetailModal({
  open,
  overview,
  loading,
  error,
  onClose,
  onRetry,
}: InsightsDetailModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop open" onClick={onClose} role="presentation">
      <div
        className="modal insights-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="insights-modal-title"
      >
        <div className="modal-head">
          <div>
            <h2 id="insights-modal-title">Detailed insights</h2>
            <p className="sub">
              {overview?.filtered
                ? 'Breakdown for your current search and filters.'
                : 'Breakdown across the full directory.'}
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body scrollbar-thin">
          {loading ? (
            <div className="stat-cards">
              {Array.from({ length: 4 }).map((_, index) => (
                <StatCard key={index} loading value="" label="" />
              ))}
            </div>
          ) : error ? (
            <div className="insights-modal-error">
              <p>{error}</p>
              <button type="button" className="btn primary" onClick={onRetry}>
                Retry
              </button>
            </div>
          ) : overview ? (
            <>
              <div className="stat-cards">
                <StatCard
                  value={overview.totalPeople.toLocaleString()}
                  label={overview.filtered ? 'People matching' : 'Total people'}
                />
                <StatCard value={overview.nationalityCount} label="Nationalities" />
                <StatCard value={overview.hobbyCount} label="Distinct hobbies" />
                <StatCard
                  value={overview.medianAge ?? '—'}
                  label="Median age"
                />
              </div>
              <div className="ins-cols">
                <FacetBars title="Top nationalities" items={overview.topNationalities} />
                <FacetBars title="Popular hobbies" items={overview.topHobbies} />
              </div>
              <AgeHistogram buckets={overview.ageDistribution} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
