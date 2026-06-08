import { useMemo, useState } from 'react'
import { Button } from './ui/button'
import {
  mergePersons,
  type AlertKind,
  type MismatchedField,
  type PersonWithPhones,
} from '@/lib/api'
import { ALERT_LABELS } from '@/lib/alert-labels'

export type ConflictCandidate = {
  other: PersonWithPhones
  kind: AlertKind
  mismatchedFields: MismatchedField[]
}

type Props = {
  survivor: PersonWithPhones
  candidate: {
    nationalId: string | null
    fullname: string | null
    phones: string[]
  }
  others: ConflictCandidate[]
  reason: string
  onReasonChange: (r: string) => void
  onMerged: (mergedPerson: PersonWithPhones) => void
  onCancel: () => void
}

const FIELD_LABELS_HE: Record<MismatchedField, string> = {
  id: 'תעודת זהות',
  name: 'שם',
  phone: 'טלפון',
}

function unique(values: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of values) {
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

export default function MergeConfirmation({
  survivor,
  candidate,
  others,
  reason,
  onReasonChange,
  onMerged,
  onCancel,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    others.length === 1 ? 0 : null,
  )
  const [confirmDifferentIds, setConfirmDifferentIds] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [confirmHighRisk, setConfirmHighRisk] = useState(false)

  const selected = selectedIdx !== null ? others[selectedIdx] : null

  const resolvedNationalId = useMemo(() => {
    if (!selected) return null
    if (candidate.nationalId) return candidate.nationalId
    return selected.other.nationalId ?? null
  }, [candidate.nationalId, selected])

  const resolvedFullname = useMemo(() => {
    if (!selected) return null
    if (candidate.fullname) return candidate.fullname
    return selected.other.fullname ?? null
  }, [candidate.fullname, selected])

  const mergedPhones = useMemo(() => {
    if (!selected) return [] as string[]
    return unique([...candidate.phones, ...selected.other.phones])
  }, [candidate.phones, selected])

  const idsDiffer =
    !!selected &&
    !!candidate.nationalId &&
    !!selected.other.nationalId &&
    candidate.nationalId !== selected.other.nationalId

  const namesDiffer =
    !!selected &&
    !!candidate.fullname &&
    !!selected.other.fullname &&
    candidate.fullname.trim().toLowerCase() !==
      selected.other.fullname.trim().toLowerCase()

  const highRisk = idsDiffer && namesDiffer

  async function onConfirm() {
    if (!selected) return
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setError('יש למלא סיבה לפני אישור המיזוג')
      return
    }
    if (idsDiffer && !confirmDifferentIds) {
      setError('יש לאשר שמדובר באותו אדם למרות תעודות זהות שונות')
      return
    }
    if (highRisk && !confirmHighRisk) {
      setError(
        'גם השם וגם תעודת הזהות שונים — סביר שמדובר בשני אנשים שונים שחולקים טלפון. סמן את התיבה אם אתה בטוח שזה אותו אדם.',
      )
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await mergePersons({
        survivorId: survivor.id,
        victimId: selected.other.id,
        resolved: {
          nationalId: resolvedNationalId,
          fullname: resolvedFullname,
        },
        phonesToKeep: mergedPhones,
        reason: trimmedReason,
        confirmDifferentIds: idsDiffer
          ? highRisk
            ? confirmHighRisk
            : confirmDifferentIds
          : false,
      })
      if (!result.ok) {
        if (result.error === 'confirm_required') {
          setError(
            'נדרש לאשר את ההמשך כשתעודות הזהות שונות — סמן את התיבה למטה.',
          )
        } else if (result.error === 'missing_reason') {
          setError('יש למלא סיבה למיזוג')
        } else if (result.error === 'not_found') {
          setError('אחד מהאזרחים כבר לא קיים במערכת')
        } else {
          setError('המיזוג נכשל')
        }
        return
      }
      onMerged(result.person)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-md border-2 border-sky-300 bg-sky-50/70 p-4 text-sky-900">
      <div className="space-y-1">
        <div className="text-sm font-semibold">
          שים לב — שמירה זו תמזג את האזרח עם אזרח קיים אחר
        </div>
        <div className="text-xs text-sky-800/90 leading-relaxed">
          אם תאשר, נשתמש בערכים שמילאת בטופס כדי לעדכן את האזרח, וכל הטלפונים
          משני האזרחים יישמרו ביחד תחת אזרח אחד. ניתן לבטל ולשנות את הערכים
          לפני השמירה אם זה לא מה שהתכוונת.
        </div>
      </div>

      <ul className="space-y-2">
        {others.map((c, i) => {
          const isSelected = selectedIdx === i
          return (
            <li
              key={c.other.id}
              className={`rounded-md border p-3 text-sm ${
                isSelected
                  ? 'border-sky-400 bg-white'
                  : 'border-sky-200 bg-white/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-slate-900">
                    {c.other.fullname || '—'}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {[
                      c.other.nationalId ? `ת"ז: ${c.other.nationalId}` : null,
                      c.other.phones.length > 0
                        ? `טלפון: ${c.other.phones.join(', ')}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </div>
                  <div className="mt-1 text-xs text-amber-700">
                    {ALERT_LABELS[c.kind] ?? c.kind}
                    {c.mismatchedFields.length > 0 && (
                      <span className="mr-1 text-slate-500">
                        ({c.mismatchedFields.map((f) => FIELD_LABELS_HE[f]).join(' · ')})
                      </span>
                    )}
                  </div>
                </div>
                {others.length > 1 && (
                  <Button
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedIdx(isSelected ? null : i)
                      setError(null)
                    }}
                  >
                    {isSelected ? 'נבחר למיזוג' : 'מזג עם אזרח זה'}
                  </Button>
                )}
              </div>

              {isSelected && (
                <div className="mt-3 space-y-3 border-t border-sky-200 pt-3">
                  <div className="rounded-md bg-sky-50 p-2 text-xs leading-relaxed text-slate-700">
                    <div className="mb-1 font-medium text-sky-900">
                      תצוגה מקדימה למה שיישמר אחרי המיזוג:
                    </div>
                    <div>
                      <span className="font-medium">ת"ז:</span>{' '}
                      {resolvedNationalId ?? '—'}
                    </div>
                    <div>
                      <span className="font-medium">שם:</span>{' '}
                      {resolvedFullname ?? '—'}
                    </div>
                    <div>
                      <span className="font-medium">טלפונים:</span>{' '}
                      {mergedPhones.length > 0 ? mergedPhones.join(', ') : '—'}
                    </div>
                  </div>

                  {highRisk && (
                    <div className="rounded-md border-2 border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                      <div className="font-semibold">
                        ⚠️ גם השם וגם תעודת הזהות שונים
                      </div>
                      <div className="mt-1 leading-relaxed text-slate-700">
                        סביר שמדובר בשני אנשים שונים שחולקים טלפון (קו בית
                        משותף, בני זוג, וכד׳). אם הם באמת אנשים שונים — לחץ
                        "ביטול" והשאר את שתי הרשומות. אם אתה בטוח שזה אותו
                        אדם — סמן את התיבה למטה.
                      </div>
                      <label className="mt-2 flex items-start gap-2 text-slate-900">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={confirmHighRisk}
                          onChange={(e) => setConfirmHighRisk(e.target.checked)}
                        />
                        <span>
                          אני בטוח/ה שזה אותו אדם למרות שגם השם וגם ת"ז שונים
                        </span>
                      </label>
                    </div>
                  )}

                  {idsDiffer && !highRisk && (
                    <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50/70 p-2 text-xs text-amber-900">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={confirmDifferentIds}
                        onChange={(e) => setConfirmDifferentIds(e.target.checked)}
                      />
                      <span>
                        אני מאשר/ת — תעודות הזהות שונות אבל זה אותו אדם.
                        <div className="mt-0.5 text-[11px] text-amber-800">
                          (טופס: {candidate.nationalId} · אזרח שני:{' '}
                          {selected?.other.nationalId})
                        </div>
                      </span>
                    </label>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      סיבת המיזוג (חובה) — תישמר בהיסטוריה
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => onReasonChange(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-sky-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-sky-400"
                      placeholder='למשל: "שוחחתי עם האזרח, אישר שזה אותו אדם"'
                    />
                  </div>

                  {error && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={onConfirm}
                      disabled={busy}
                    >
                      {busy ? 'ממזג...' : 'אשר מיזוג'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={onCancel}
                      disabled={busy}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {others.length > 1 && selectedIdx === null && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancel}
          >
            ביטול
          </Button>
        </div>
      )}
    </div>
  )
}
