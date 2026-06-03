import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import type { Alert, AlertKind } from '@/lib/api'

type Props = {
  fileName: string
  inserted: number
  ignored: number
  phoneAdded: number
  alerts: Alert[]
  onUploadAnother: () => void
}

const ALERT_LABELS: Record<AlertKind, string> = {
  name_mismatch_on_id: 'שם שונה לאותה תעודת זהות',
  name_phone_mismatch_on_id: 'שם וטלפון שונים לאותה תעודת זהות',
  id_mismatch_name_phone_match: 'תעודת זהות שונה לאותו שם וטלפון',
  id_name_mismatch_on_phone: 'תעודת זהות ושם שונים לאותו טלפון',
  cross_person_mismatch: 'טלפון משויך כעת לאדם אחר',
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
        <Stat label="נוספו" value={inserted} tone="sky" />
        <Stat label="כבר קיימים" value={ignored} tone="slate" />
        <Stat label="טלפונים נוספו" value={phoneAdded} tone="emerald" />
        <Stat label="התראות" value={alerts.length} tone="amber" />
      </div>

      {alerts.length > 0 && (
        <div className="w-full max-w-2xl text-right">
          <div className="mb-2 text-xs font-medium text-slate-500">
            התראות שדורשות בדיקה ידנית:
          </div>
          <ul className="space-y-1.5">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-slate-700"
              >
                <div className="font-medium text-amber-800">
                  {ALERT_LABELS[a.kind]}
                </div>
                <div className="mt-0.5 text-slate-500">
                  {[
                    a.details.incoming.fullname,
                    a.details.incoming.id,
                    a.details.incoming.phone.join(', '),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
