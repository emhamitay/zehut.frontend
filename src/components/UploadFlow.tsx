import { useState } from 'react'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import FileDropZone from './FileDropZone'
import ConflictResolver from './ConflictResolver'
import UploadSummary from './UploadSummary'
import {
  commitContacts,
  extractContacts,
  type CommitResult,
  type PersonWithPhones,
} from '@/lib/api'

type Phase =
  | { kind: 'idle' }
  | { kind: 'parsing'; fileName: string }
  | { kind: 'extracting'; fileName: string }
  | { kind: 'committing'; fileName: string }
  | {
      kind: 'conflicts'
      fileName: string
      remaining: CommitResult['conflicts']
      addedFromConflicts: PersonWithPhones[]
      initial: CommitResult
    }
  | {
      kind: 'summary'
      fileName: string
      added: number
      merged: number
      skipped: number
    }

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

  async function handleFile(file: File) {
    setError(null)
    setPhase({ kind: 'parsing', fileName: file.name })
    try {
      const payload = await parseFile(file)
      setPhase({ kind: 'extracting', fileName: file.name })
      const contacts = await extractContacts(payload)
      setPhase({ kind: 'committing', fileName: file.name })
      const result = await commitContacts(contacts, file.name)
      if (result.conflicts.length === 0) {
        setPhase({
          kind: 'summary',
          fileName: file.name,
          added: result.inserted.length,
          merged: result.merged.length,
          skipped: 0,
        })
      } else {
        setPhase({
          kind: 'conflicts',
          fileName: file.name,
          remaining: result.conflicts,
          addedFromConflicts: [],
          initial: result,
        })
      }
    } catch (e) {
      setError((e as Error).message || 'אירעה שגיאה בעיבוד הקובץ')
      setPhase({ kind: 'idle' })
    }
  }

  function reset() {
    setError(null)
    setPhase({ kind: 'idle' })
  }

  if (phase.kind === 'conflicts') {
    return (
      <ConflictResolver
        conflicts={phase.remaining}
        fileName={phase.fileName}
        onDone={(stats) => {
          const initial = phase.initial
          setPhase({
            kind: 'summary',
            fileName: phase.fileName,
            added: initial.inserted.length + stats.newCount,
            merged: initial.merged.length + stats.mergeCount,
            skipped: stats.skipCount,
          })
        }}
      />
    )
  }

  if (phase.kind === 'summary') {
    return (
      <UploadSummary
        fileName={phase.fileName}
        added={phase.added}
        merged={phase.merged}
        skipped={phase.skipped}
        onUploadAnother={reset}
      />
    )
  }

  const busyLabel =
    phase.kind === 'parsing'
      ? 'מעבד קובץ...'
      : phase.kind === 'extracting'
        ? 'מחלץ אנשי קשר...'
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
