import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import MergeConfirmation from './MergeConfirmation'
import type { Alert, PersonWithPhones } from '@/lib/api'
import { ALERT_LABELS } from '@/lib/alert-labels'

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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [mergeOpen, setMergeOpen] = useState<Record<string, boolean>>({})
  const [reasonsByPerson, setReasonsByPerson] = useState<Record<string, string>>({})
  const [mergedNotice, setMergedNotice] = useState<Record<string, string>>({})

  const personMap = new Map<string, typeof alerts>()
  for (const alert of alerts) {
    if (!personMap.has(alert.personId)) {
      personMap.set(alert.personId, [])
    }
    personMap.get(alert.personId)!.push(alert)
  }

  const personById = new Map<string, PersonWithPhones>()
  for (const p of inserted) personById.set(p.id, p)
  for (const { person } of phoneAdded) personById.set(person.id, person)

  const visibleGroups = Array.from(personMap.entries()).filter(
    ([id]) => !dismissed.has(id),
  )

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
        <Stat label="התראות" value={alerts.length} tone="amber" />
      </div>

      {visibleGroups.length > 0 && (
        <div className="w-full max-w-2xl text-right">
          <div className="mb-2 text-xs font-medium text-slate-500">
            אזרחים שצריכים בדיקה ידנית ({visibleGroups.length}):
          </div>
          <ul className="space-y-2">
            {visibleGroups.map(([personId, groupAlerts]) => {
              const person = personById.get(personId)
              const alertWithRelated = groupAlerts.find(
                (a) => a.relatedPerson != null,
              )
              const relatedPerson = alertWithRelated?.relatedPerson ?? null
              const isMergeOpen = mergeOpen[personId] === true
              const reason = reasonsByPerson[personId] ?? ''
              const successNotice = mergedNotice[personId]
              return (
                <li
                  key={personId}
                  className="space-y-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-right"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-amber-800">
                        {person?.fullname || '—'}
                      </div>
                      <div className="mt-0.5 text-slate-600">
                        {[
                          person?.nationalId ? `ת"ז: ${person.nationalId}` : null,
                          person?.phones.length
                            ? `טלפון: ${person.phones.join(', ')}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {groupAlerts.map((a) => (
                          <div key={a.id} className="text-slate-700">
                            • {ALERT_LABELS[a.kind]}
                          </div>
                        ))}
                      </div>
                      {relatedPerson && (
                        <div className="mt-2 rounded-md border border-amber-200/70 bg-white/70 p-2">
                          <div className="text-[11px] text-slate-500">
                            מתנגש עם אזרח קיים:
                          </div>
                          <div className="font-medium text-slate-900">
                            {relatedPerson.fullname || '—'}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {[
                              relatedPerson.nationalId
                                ? `ת"ז: ${relatedPerson.nationalId}`
                                : null,
                              relatedPerson.phones.length
                                ? `טלפון: ${relatedPerson.phones.join(', ')}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="outline" size="xs" asChild>
                        <Link to={`/citizens/${personId}`}>ערוך</Link>
                      </Button>
                      {relatedPerson && person && !isMergeOpen && (
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() =>
                            setMergeOpen((s) => ({ ...s, [personId]: true }))
                          }
                        >
                          מזג
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          setDismissed((s) => new Set([...s, personId]))
                        }
                      >
                        השאר כך
                      </Button>
                    </div>
                  </div>

                  {successNotice && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50/70 px-2 py-1 text-[11px] text-emerald-800">
                      {successNotice}
                    </div>
                  )}

                  {isMergeOpen && person && relatedPerson && alertWithRelated && (
                    <MergeConfirmation
                      survivor={person}
                      candidate={{
                        nationalId: person.nationalId,
                        fullname: person.fullname,
                        phones: person.phones,
                      }}
                      others={[
                        {
                          other: relatedPerson,
                          kind: alertWithRelated.kind,
                          mismatchedFields:
                            alertWithRelated.details.mismatchedFields,
                        },
                      ]}
                      reason={reason}
                      onReasonChange={(r) =>
                        setReasonsByPerson((s) => ({ ...s, [personId]: r }))
                      }
                      onMerged={() => {
                        setMergeOpen((s) => ({ ...s, [personId]: false }))
                        setMergedNotice((s) => ({
                          ...s,
                          [personId]: 'המיזוג בוצע בהצלחה',
                        }))
                        setDismissed((s) => new Set([...s, personId]))
                      }}
                      onCancel={() =>
                        setMergeOpen((s) => ({ ...s, [personId]: false }))
                      }
                    />
                  )}
                </li>
              )
            })}
          </ul>
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
