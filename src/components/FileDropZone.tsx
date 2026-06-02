import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import clsx from 'clsx'

// State machine for the file drop zone component. It can be in one of the following states:
// - idle: waiting for user interaction
// - dragging: user is dragging a file over the drop zone
// - parsing: file is being parsed and sent to the server
// - done: file was successfully processed, showing results
// - error: an error occurred, showing error message

type State =
  | { kind: 'idle' }
  | { kind: 'dragging' }
  | { kind: 'parsing' }
  | { kind: 'done'; fileName: string; count: number; label: string }
  | { kind: 'error'; message: string }

// List of depencies for file Extensions

const ACCEPTED = ['.xlsx', '.xls', '.docx']

function accept(file: File): boolean {
  return ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext))
}

// Parses the given file and returns a structured payload for the API.
// This method executes when the user drops a file or selects one via the file input (fires by the handleFile method).

async function parseFile(
  file: File
): Promise<{ type: 'excel'; rows: Record<string, unknown>[] } | { type: 'docx'; text: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
    return { type: 'excel', rows }
  }

  if (ext === 'docx') {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return { type: 'docx', text: result.value }
  }

  throw new Error('סוג קובץ לא נתמך')
}

// Main Component

export default function FileDropZone() {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

  //Handles the file processing workflow: validation, parsing, sending to API, and updating state based on results or errors.
  //Executed when a file is dropped or selected via the file input.
  async function handleFile(file: File) {
    if (!accept(file)) {
      setState({
        kind: 'error',
        message: 'סוג קובץ לא נתמך. יש לבחור קובץ xlsx, xls או docx בלבד.',
      })
      return
    }

    setState({ kind: 'parsing' })

    //Parse the file & send it to the api
    try {
      const payload = await parseFile(file);
      console.log('Parsed payload:', payload) // Debug log to verify the parsed content

      await fetch(`${apiBaseUrl}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const count =
        payload.type === 'excel' ? payload.rows.length : payload.text.length
      const label = payload.type === 'excel' ? 'שורות' : 'תווים'
      setState({ kind: 'done', fileName: file.name, count, label })
    } catch {
      setState({
        kind: 'error',
        message: 'אירעה שגיאה בעיבוד הקובץ. אנא נסה שנית.',
      })
    }
  }

  // Event handlers for drag-and-drop and file input interactions. They manage the component's state to reflect the current interaction phase (e.g., dragging, parsing, done, error).
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (state.kind !== 'parsing') setState({ kind: 'dragging' })
  }

  function onDragLeave() {
    if (state.kind === 'dragging') setState({ kind: 'idle' })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const isDragging = state.kind === 'dragging'

  // The component's UI adapts based on the current state, providing visual feedback for each phase of the file upload and processing workflow. It uses Tailwind CSS for styling and clsx for conditional class names.
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="העלאת קובץ"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={clsx(
        'flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3',
        'rounded-xl border border-dashed transition-colors duration-200',
        'select-none text-center',
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

      {(state.kind === 'idle' || state.kind === 'dragging') && (
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

      {state.kind === 'parsing' && (
        <>
          <Spinner />
          <p className="text-sm font-medium text-slate-500">מעבד קובץ...</p>
        </>
      )}

      {state.kind === 'done' && (
        <>
          <CheckIcon className="h-10 w-10 text-sky-500" />
          <p className="text-sm font-medium text-slate-700">{state.fileName}</p>
          <p className="text-xs text-slate-400">
            נמצאו {state.count} {state.label}
          </p>
        </>
      )}

      {state.kind === 'error' && (
        <p className="px-4 text-sm font-medium text-red-500">{state.message}</p>
      )}
    </div>
  )
}

// -- Icons and Spinner components for visual feedback during different states of the file upload and processing workflow. They enhance the user experience by providing clear indicators of the current status (e.g., uploading, success, error).

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

function CheckIcon({ className }: { className?: string }) {
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
        d="m4.5 12.75 6 6 9-13.5"
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
