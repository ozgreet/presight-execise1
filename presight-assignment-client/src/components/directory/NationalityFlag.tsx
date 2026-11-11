import { getNationalityFlag } from '../../lib/nationalityFlags'

type NationalityFlagProps = {
  nationality: string
  className?: string
}

export function NationalityFlag({ nationality, className }: NationalityFlagProps) {
  const flag = getNationalityFlag(nationality)
  if (!flag) {
    return null
  }

  return (
    <span className={className ?? 'nationality-flag'} aria-hidden="true">
      {flag}
    </span>
  )
}
