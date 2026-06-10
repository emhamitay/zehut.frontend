import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import {
  DATA_ERROR_ANCHOR,
  EDIT_ACTION_LABEL,
  describeDataError,
} from '@/lib/data-error-copy'
import type { Alert } from '@/lib/api'

type Props = {
  // Which citizen is "us" — the row is rendered on this citizen's surface.
  selfPersonId: string
  alert: Alert
  // Optional override for the edit target. Defaults to the self citizen's
  // detail page anchored on the data-errors section.
  editHref?: string
  // Render-mode tweak: print-friendly variant strips the button.
  variant?: 'interactive' | 'print'
}

function WarningTriangle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function DataErrorRow({
  selfPersonId,
  alert,
  editHref,
  variant = 'interactive',
}: Props) {
  const { label, headline, explanation, other, otherName, otherIdNote } =
    describeDataError(alert)
  const href = editHref ?? `/citizens/${selfPersonId}#${DATA_ERROR_ANCHOR}`

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-red-200/80 bg-red-50/70 px-3.5 py-3 dark:border-red-900/40 dark:bg-red-950/20"
      data-data-error-row
      data-error-type={alert.errorType}
    >
      <WarningTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />

      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-semibold text-red-900 dark:text-red-200">
          {label}
        </span>
        <p className="text-sm text-foreground/90">{headline}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {explanation}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-xs text-muted-foreground">האדם השני:</span>
          {other.personId && variant === 'interactive' ? (
            <Link
              to={`/citizens/${other.personId}#${DATA_ERROR_ANCHOR}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              {otherName}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium">
              {otherName}
            </span>
          )}
          {other.fromImport ? (
            <span
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="הרשומה הזו לא נשמרה כאזרח נפרד כי תעודת הזהות זהה. הנתונים שמופיעים כאן הם מהקובץ שיובא."
            >
              מהקובץ שיובא
            </span>
          ) : null}
          {otherIdNote ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {otherIdNote}
            </span>
          ) : null}
        </div>
      </div>

      {variant === 'interactive' ? (
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link to={href}>{EDIT_ACTION_LABEL}</Link>
        </Button>
      ) : null}
    </div>
  )
}
