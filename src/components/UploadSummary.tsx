import { Link } from 'react-router-dom'
import { Button } from './ui/button'

type Props = {
  fileName: string
  added: number
  merged: number
  skipped: number
  onUploadAnother: () => void
}

export default function UploadSummary({
  fileName,
  added,
  merged,
  skipped,
  onUploadAnother,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-border/70 bg-muted/20 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
        <CheckIcon className="h-7 w-7 text-sky-600" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-700">{fileName}</p>
        <p className="text-xs text-slate-400">הקובץ הועלה בהצלחה</p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <Stat label="נוספו" value={added} tone="sky" />
        <Stat label="מוזגו" value={merged} tone="emerald" />
        <Stat label="דולגו" value={skipped} tone="slate" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onUploadAnother}>העלאת קובץ נוסף</Button>
        <Button variant="outline" asChild>
          <Link to="/get-people">צפייה באנשי הקשר</Link>
        </Button>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'sky' | 'emerald' | 'slate'
}) {
  const toneClass =
    tone === 'sky'
      ? 'text-sky-600'
      : tone === 'emerald'
        ? 'text-emerald-600'
        : 'text-slate-500'
  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-4">
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
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
        strokeWidth={2}
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  )
}
