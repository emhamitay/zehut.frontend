import { useEffect, useRef } from 'react'
import { Button } from './ui/button'
import {
  SAVE_MODAL_CLOSE_LABEL,
  saveCollisionExplanation,
  saveCollisionLine,
  saveCollisionTitle,
} from '@/lib/data-error-copy'
import type { ConflictDetail } from '@/lib/api'

type Props = {
  conflicts: ConflictDetail[]
  onClose: () => void
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

// Small dialog. Non-technical users get a sentence in plain Hebrew
// explaining *why* the save was blocked and what to do. The backdrop is
// a light dim + blur rather than a heavy black overlay, so the page stays
// recognizable behind it. After dismiss, the caller gently highlights the
// offending field — that's the breadcrumb. No red borders on the form.
export function SaveCollisionModal({ conflicts, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const single = conflicts.length === 1

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="save-collision-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-2xl outline-none"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <WarningTriangle className="size-5" />
          </span>
          <div className="flex-1">
            <h2
              id="save-collision-title"
              className="text-base font-semibold text-foreground"
            >
              {saveCollisionTitle()}
            </h2>

            {single ? (
              <div className="mt-1.5 space-y-1.5">
                <p className="text-sm text-foreground/90">
                  {saveCollisionLine(conflicts[0])}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {saveCollisionExplanation(conflicts[0])}
                </p>
              </div>
            ) : (
              <ul className="mt-1.5 space-y-2">
                {conflicts.map((c, i) => (
                  <li key={i} className="space-y-1">
                    <p className="text-sm text-foreground/90">
                      {saveCollisionLine(c)}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {saveCollisionExplanation(c)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-start">
          <Button onClick={onClose}>{SAVE_MODAL_CLOSE_LABEL}</Button>
        </div>
      </div>
    </div>
  )
}
