import { useEffect, useRef } from 'react'
import { Button } from './ui/button'
import {
  SAVE_MODAL_CLOSE_LABEL,
  saveCollisionLine,
  saveCollisionTitle,
} from '@/lib/data-error-copy'
import type { ConflictDetail } from '@/lib/api'

type Props = {
  conflicts: ConflictDetail[]
  onClose: () => void
}

// Small centered modal. Non-technical users get a sentence in plain
// Hebrew explaining *why* the save was blocked and what to do. After
// they dismiss it, the caller is expected to gently highlight the
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

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="save-collision-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-background p-5 shadow-xl outline-none"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="save-collision-title" className="mb-2 text-base font-semibold">
          {saveCollisionTitle()}
        </h2>
        {conflicts.length === 1 ? (
          <p className="text-sm text-muted-foreground">
            {saveCollisionLine(conflicts[0])}
          </p>
        ) : (
          <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
            {conflicts.map((c, i) => (
              <li key={i}>{saveCollisionLine(c)}</li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-start">
          <Button onClick={onClose}>{SAVE_MODAL_CLOSE_LABEL}</Button>
        </div>
      </div>
    </div>
  )
}
