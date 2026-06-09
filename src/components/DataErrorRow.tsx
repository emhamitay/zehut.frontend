import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import {
  DATA_ERROR_ANCHOR,
  EDIT_ACTION_LABEL,
  describeOtherSide,
  rowMessage,
} from '@/lib/data-error-copy'
import { DATA_ERROR_TYPE_LABELS } from '@/lib/alert-labels'
import type { Alert } from '@/lib/api'

type Props = {
  // Which citizen is "us" — the row is rendered on this citizen's surface.
  selfPersonId: string
  alert: Alert
  // Optional override for the edit target. Defaults to the self citizen's
  // detail page anchored on the data-errors section.
  editHref?: string
  // Render-mode tweak: print-friendly variant strips the button and uses
  // dimmer borders; used in the printable contact sheet.
  variant?: 'interactive' | 'print'
}

function pickCollidingValue(alert: Alert): string {
  // The colliding value is whatever is shared between self and the other
  // side. We surface the other side's value here because the row is
  // about pointing out who else has it. The form's inline-on-field
  // rendering does the symmetric thing.
  const other = alert.relatedPerson
  if (!other) return '—'
  if (alert.errorType === 'id_data_error') {
    return other.nationalId ?? '—'
  }
  return other.phones[0] ?? '—'
}

export function DataErrorRow({ selfPersonId, alert, editHref, variant = 'interactive' }: Props) {
  const other = alert.relatedPerson
  const collidingValue = pickCollidingValue(alert)
  const label = DATA_ERROR_TYPE_LABELS[alert.errorType]
  const message = rowMessage({
    errorType: alert.errorType,
    collidingValue,
    otherFullname: other?.fullname ?? null,
  })
  const href = editHref ?? `/citizens/${selfPersonId}#${DATA_ERROR_ANCHOR}`

  const tone =
    alert.errorType === 'id_data_error'
      ? 'border-amber-400/60 bg-amber-50 dark:bg-amber-950/30'
      : 'border-sky-400/60 bg-sky-50 dark:bg-sky-950/30'

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-md border ${tone} px-3 py-2`}
      data-data-error-row
      data-error-type={alert.errorType}
    >
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{message}</span>
        {other ? (
          <Link
            to={`/citizens/${other.id}#${DATA_ERROR_ANCHOR}`}
            className="text-xs text-muted-foreground/80 underline-offset-2 hover:underline"
          >
            {describeOtherSide({ fullname: other.fullname })}
          </Link>
        ) : null}
      </div>
      {variant === 'interactive' ? (
        <Button asChild size="sm" variant="outline">
          <Link to={href}>{EDIT_ACTION_LABEL}</Link>
        </Button>
      ) : null}
    </div>
  )
}
