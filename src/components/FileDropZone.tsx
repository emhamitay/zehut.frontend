import { useRef, useState } from 'react'
import clsx from 'clsx'
import { SpinnerIcon, UploadIcon } from './icons'

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
          <SpinnerIcon className="h-8 w-8 animate-spin text-sky-400" />
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
