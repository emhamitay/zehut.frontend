import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import FileDropZone from './FileDropZone'
import UploadSummary from './UploadSummary'
import {
  commitContacts,
  extractContacts,
  type Alert,
  type PersonWithPhones,
} from '@/lib/api'

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

async function parseFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
    return { type: 'excel' as const, rows }
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
    if (phase.kind !== 'extracting') {
      setExtractingMessageIndex(0)
      return
    }

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
      setPhase({ kind: 'extracting', fileName: file.name })
      const contacts = await extractContacts(payload)
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
    <FileDropZone
      onFile={handleFile}
      busy={phase.kind !== 'idle'}
      busyLabel={busyLabel}
      error={error}
    />
  )
}
