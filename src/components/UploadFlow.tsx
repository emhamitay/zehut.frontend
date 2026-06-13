import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import FileDropZone from './FileDropZone'
import UploadSummary from './UploadSummary'
import { WarningIcon } from './icons'
import {
  commitContacts,
  extractContacts,
  type Alert,
  type PersonWithPhones,
} from '@/lib/api'
import {
  shouldFallbackToAiAfterClientParse,
  tryParseExcelClientSide,
} from '@/lib/excel-parser'

type Phase =
  | { kind: 'idle' }
  | { kind: 'parsing'; fileName: string }
  | { kind: 'extracting'; fileName: string }
  | { kind: 'committing'; fileName: string }
  | {
      kind: 'summary'
      fileName: string
      inserted: PersonWithPhones[]
      ignored: number
      phoneAdded: { person: PersonWithPhones; addedPhones: string[] }[]
      alerts: Alert[]
    }

const EXTRACTING_MESSAGES = [
  'בעה"י עובדים על זה עכשיו...',
  'בעזרת השם, עוד רגע וזה מוכן...',
  'בעה"י אנחנו מסדרים את הכל כמו שצריך...',
  'בס"ד, המערכת חושבת ומעדכנת...',
  'בעזרת השם, תכף נסיים בשבילך...',
  'בעה"י זה מתקדם יפה ממש עכשיו...',
  'בסייעתא דשמיא, עוד טיפונת סבלנות...',
  'בעזרת השם, מיד תראה תוצאה...',
  'בעה"י הכל בבדיקה אחרונה...',
  'בס"ד, אנחנו כבר בשלבים האחרונים...',
]

const SHOW_AI_DATA_WARNING = import.meta.env.VITE_AI_SENDS_DATA === 'true'

function AiDataWarningBanner() {
  console.log('SHOW_AI_DATA_WARNING', SHOW_AI_DATA_WARNING)
  if (!SHOW_AI_DATA_WARNING) return null

  return (
    <div
      role="note"
      className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-amber-950 shadow-sm ring-1 ring-amber-200/60"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
        <WarningIcon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">הערת פרטיות חשובה</p>
        <p className="text-sm leading-6 text-amber-900/90">
          עתה עיבוד האקסל עובר דרך AI מרוחק, המידע נשלח לשירות חיצוני. לכן אין
          להעלות כאן מספרי תעודת זהות אמיתיים. לסביבה חיה ולשימוש בנתונים אמיתיים,
          יש לפנות למפתח כדי להפעיל את גרסת ה-AI בתשלום.
        </p>
      </div>
    </div>
  )
}

async function parseFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    return { type: 'excel' as const, sheet }
  }
  if (ext === 'docx') {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return { type: 'docx' as const, text: result.value }
  }
  throw new Error('סוג קובץ לא נתמך')
}

export default function UploadFlow() {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [error, setError] = useState<string | null>(null)
  const [extractingMessageIndex, setExtractingMessageIndex] = useState(0)

  useEffect(() => {
    if (phase.kind !== 'extracting') return

    const intervalId = window.setInterval(() => {
      setExtractingMessageIndex((prev) => (prev + 1) % EXTRACTING_MESSAGES.length)
    }, 10000)

    return () => window.clearInterval(intervalId)
  }, [phase.kind])

  async function handleFile(file: File) {
    setError(null)
    setPhase({ kind: 'parsing', fileName: file.name })
    try {
      const payload = await parseFile(file)

      let contacts: Awaited<ReturnType<typeof extractContacts>>

      if (payload.type === 'excel') {
        const clientContacts = tryParseExcelClientSide(payload.sheet)
        if (
          clientContacts !== null &&
          !shouldFallbackToAiAfterClientParse(clientContacts)
        ) {
          // Parsed entirely on the client — skip OpenRouter
          contacts = clientContacts
        } else {
          // Structure too ambiguous — fall back to server-side extraction
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(payload.sheet, { raw: true })
          setExtractingMessageIndex(0)
          setPhase({ kind: 'extracting', fileName: file.name })
          contacts = await extractContacts({ type: 'excel', rows })
        }
      } else {
        // DOCX always goes through OpenRouter
        setExtractingMessageIndex(0)
        setPhase({ kind: 'extracting', fileName: file.name })
        contacts = await extractContacts(payload)
      }

      setPhase({ kind: 'committing', fileName: file.name })
      const result = await commitContacts(contacts, file.name)
      setPhase({
        kind: 'summary',
        fileName: file.name,
        inserted: result.inserted,
        ignored: result.ignored,
        phoneAdded: result.phoneAdded,
        alerts: result.alerts,
      })
    } catch (e) {
      setError((e as Error).message || 'אירעה שגיאה בעיבוד הקובץ')
      setPhase({ kind: 'idle' })
    }
  }

  function reset() {
    setError(null)
    setPhase({ kind: 'idle' })
  }

  if (phase.kind === 'summary') {
    return (
      <UploadSummary
        fileName={phase.fileName}
        inserted={phase.inserted}
        ignored={phase.ignored}
        phoneAdded={phase.phoneAdded}
        alerts={phase.alerts}
        onUploadAnother={reset}
      />
    )
  }

  const busyLabel =
    phase.kind === 'parsing'
      ? 'מעבד קובץ...'
      : phase.kind === 'extracting'
        ? EXTRACTING_MESSAGES[extractingMessageIndex]
        : phase.kind === 'committing'
          ? 'שומר לבסיס הנתונים...'
          : undefined

  return (
    <div>
      <AiDataWarningBanner />
      <FileDropZone
        onFile={handleFile}
        busy={phase.kind !== 'idle'}
        busyLabel={busyLabel}
        error={error}
      />
    </div>
  )
}
