import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { DataErrorRow } from './DataErrorRow'
import type { Alert, PersonWithPhones } from '@/lib/api'

type Props = {
  fileName: string
  inserted: PersonWithPhones[]
  ignored: number
  phoneAdded: { person: PersonWithPhones; addedPhones: string[] }[]
  alerts: Alert[]
  onUploadAnother: () => void
}

export default function UploadSummary({
  fileName,
  inserted,
  ignored,
  phoneAdded,
  alerts,
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

      <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="נוספו" value={inserted.length} tone="sky" />
        <Stat label="כבר קיימים" value={ignored} tone="slate" />
        <Stat label="טלפונים נוספו" value={phoneAdded.length} tone="emerald" />
        <Stat label="שגיאות נתונים" value={alerts.length} tone="amber" />
      </div>

      {alerts.length > 0 && (
        <div className="w-full max-w-2xl text-right">
          <div className="mb-2 text-xs font-medium text-slate-500">
            שגיאות נתונים שזוהו ({alerts.length}):
          </div>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id}>
                <DataErrorRow selfPersonId={a.personId} alert={a} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">
            לחיצה על "ערוך" תפתח את האזרח שזיהינו עם השדה שטעון תיקון.
            תיקון השדה המתנגש סוגר את השגיאה אוטומטית.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onUploadAnother}>העלאת קובץ נוסף</Button>
        <Button variant="outline" asChild>
          <Link to="/contact-sheets">צפייה בדפי קשר</Link>
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
  tone: 'sky' | 'emerald' | 'slate' | 'amber'
}) {
  const toneClass =
    tone === 'sky'
      ? 'text-sky-600'
      : tone === 'emerald'
        ? 'text-emerald-600'
        : tone === 'amber'
          ? 'text-amber-600'
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
