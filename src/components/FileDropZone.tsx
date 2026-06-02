import { useRef, useState } from 'react'
import clsx from 'clsx'

type Props = {
  onFile: (file: File) => void
  busy?: boolean
  busyLabel?: string
  error?: string | null
}

const ACCEPTED = ['.xlsx', '.xls', '.docx']

function accept(file: File): boolean {
  return ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext))
}

export default function FileDropZone({
  onFile,
  busy = false,
  busyLabel = 'מעבד קובץ...',
  error = null,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!accept(file)) {
      setLocalError(
        'סוג קובץ לא נתמך. יש לבחור קובץ xlsx, xls או docx בלבד.'
      )
      return
    }
    setLocalError(null)
    onFile(file)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!busy) setIsDragging(true)
  }

  function onDragLeave() {
    setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (busy) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const shownError = error ?? localError

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="העלאת קובץ"
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) =>
        e.key === 'Enter' && !busy && inputRef.current?.click()
      }
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={clsx(
        'flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3',
        'rounded-xl border border-dashed transition-colors duration-200',
        'select-none text-center',
        busy && 'cursor-wait opacity-90',
        isDragging
          ? 'border-sky-400 bg-sky-50/60'
          : 'border-border/70 bg-muted/20 hover:border-sky-300 hover:bg-sky-50/30'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.docx"
        className="hidden"
        onChange={onInputChange}
      />

      {busy ? (
        <>
          <Spinner />
          <p className="text-sm font-medium text-slate-500">{busyLabel}</p>
        </>
      ) : (
        <>
          <UploadIcon
            className={clsx(
              'h-10 w-10 transition-colors',
              isDragging ? 'text-sky-500' : 'text-sky-300'
            )}
          />
          <p
            className={clsx(
              'text-sm font-medium transition-colors',
              isDragging ? 'text-sky-600' : 'text-slate-500'
            )}
          >
            גרור קובץ לכאן או לחץ לבחירה
          </p>
          <p className="text-xs text-slate-400">xlsx, xls, docx</p>
        </>
      )}

      {shownError && (
        <p className="px-4 text-sm font-medium text-red-500">{shownError}</p>
      )}
    </div>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className="h-8 w-8 animate-spin text-sky-400"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
