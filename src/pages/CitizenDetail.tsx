import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import MergeConfirmation, {
  type ConflictCandidate,
} from '../components/MergeConfirmation'
import {
  deletePerson,
  getPerson,
  getPersonHistory,
  updatePerson,
  type Alert,
  type ConflictDetail,
  type PersonAuditField,
  type PersonHistoryEntry,
  type PersonWithPhones,
} from '../lib/api'
import { ALERT_LABELS } from '../lib/alert-labels'

const FIELD_LABELS: Record<PersonAuditField, string> = {
  nationalId: 'תעודת זהות',
  fullname: 'שם מלא',
  phone_added: 'טלפון נוסף',
  phone_removed: 'טלפון הוסר',
  merged_from: 'מוזג מאזרח אחר',
  deleted: 'האזרח נמחק',
}

type PhoneRow = {
  key: string
  value: string
  originalRaw: string | null
}

function genKey(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function CitizenDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<PersonWithPhones | null>(null)
  const [openAlerts, setOpenAlerts] = useState<Alert[]>([])
  const [history, setHistory] = useState<PersonHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [nationalId, setNationalId] = useState('')
  const [fullname, setFullname] = useState('')
  const [phoneRows, setPhoneRows] = useState<PhoneRow[]>([])
  const [reason, setReason] = useState('')

  const [busy, setBusy] = useState(false)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ConflictDetail[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    try {
      const result = await getPerson(id)
      if (!result) {
        setNotFound(true)
        return
      }
      setPerson(result.person)
      setOpenAlerts(result.openAlerts)
      setNationalId(result.person.nationalId ?? '')
      setFullname(result.person.fullname ?? '')
      setPhoneRows(
        result.person.phones.map((raw) => ({
          key: genKey(),
          value: raw,
          originalRaw: raw,
        })),
      )
      const h = await getPersonHistory(id)
      setHistory(h)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  function updatePhoneRow(key: string, value: string) {
    setPhoneRows((rows) =>
      rows.map((r) => (r.key === key ? { ...r, value } : r)),
    )
  }

  function removePhoneRow(key: string) {
    setPhoneRows((rows) => rows.filter((r) => r.key !== key))
  }

  function addPhoneRow() {
    setPhoneRows((rows) => [
      ...rows,
      { key: genKey(), value: '', originalRaw: null },
    ])
  }

  const lastRowEmpty =
    phoneRows.length > 0 &&
    phoneRows[phoneRows.length - 1].value.trim() === ''

  const currentTrimmedPhones = phoneRows
    .map((r) => r.value.trim())
    .filter((v) => v.length > 0)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id || !person) return
    setBusy(true)
    setError(null)
    setConflicts(null)
    setSavedNotice(null)

    const trimmedRows = phoneRows.map((r) => ({ ...r, value: r.value.trim() }))
    const addList: string[] = []
    for (const r of trimmedRows) {
      if (!r.value) continue
      if (r.originalRaw === null || r.originalRaw !== r.value) {
        addList.push(r.value)
      }
    }
    const removeList: string[] = []
    for (const raw of person.phones) {
      const stillThere = trimmedRows.some(
        (r) => r.originalRaw === raw && r.value === raw,
      )
      if (!stillThere) removeList.push(raw)
    }

    const input: Parameters<typeof updatePerson>[1] = {}
    const trimmedNationalId = nationalId.trim()
    const newNationalId = trimmedNationalId === '' ? null : trimmedNationalId
    if (newNationalId !== person.nationalId) input.nationalId = newNationalId

    const trimmedFullname = fullname.trim()
    const newFullname = trimmedFullname === '' ? null : trimmedFullname
    if (newFullname !== person.fullname) input.fullname = newFullname

    if (addList.length > 0 || removeList.length > 0) {
      input.phones = {}
      if (addList.length > 0) input.phones.add = addList
      if (removeList.length > 0) input.phones.remove = removeList
    }
    if (reason.trim()) input.reason = reason.trim()

    const meaningfulKeys = Object.keys(input).filter((k) => k !== 'reason')
    if (meaningfulKeys.length === 0) {
      setBusy(false)
      setError('אין שינויים לשמירה')
      return
    }

    try {
      const result = await updatePerson(id, input)
      if (!result.ok) {
        if ('notFound' in result) {
          setNotFound(true)
        } else {
          setConflicts(result.conflicts)
        }
        return
      }
      const resolvedCount = result.resolvedAlerts.length
      setSavedNotice(
        resolvedCount > 0
          ? `עודכן בהצלחה. ${resolvedCount} התראות נסגרו אוטומטית`
          : 'עודכן בהצלחה',
      )
      setReason('')
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmDelete() {
    if (!id) return
    const trimmed = deleteReason.trim()
    if (!trimmed) {
      setDeleteError('יש למלא סיבה למחיקה')
      return
    }
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      const result = await deletePerson(id, trimmed)
      if (!result.ok) {
        if (result.error === 'not_found') {
          setNotFound(true)
        } else if (result.error === 'missing_reason') {
          setDeleteError('יש למלא סיבה למחיקה')
        } else {
          setDeleteError('המחיקה נכשלה')
        }
        return
      }
      navigate('/citizens')
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleteBusy(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="עדכון אזרח">
        <p className="text-sm text-slate-500">טוען...</p>
      </AppLayout>
    )
  }

  if (notFound || !person) {
    return (
      <AppLayout title="עדכון אזרח">
        <div className="space-y-3">
          <p className="text-sm text-destructive">האזרח לא נמצא</p>
          <Button variant="outline" asChild>
            <Link to="/citizens">חזרה לחיפוש</Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  const others: ConflictCandidate[] =
    conflicts?.map((c) => ({
      other: {
        id: c.otherPerson.id,
        nationalId: c.otherPerson.nationalId,
        fullname: c.otherPerson.fullname,
        sourceFile: null,
        createdAt: '',
        updatedAt: '',
        phones: c.otherPerson.phones,
      },
      kind: c.kind,
      mismatchedFields: c.mismatchedFields,
    })) ?? []

  return (
    <AppLayout title="עדכון אזרח">
      <div className="space-y-6">
        <div className="rounded-lg border border-border/70 bg-card/50 p-4">
          <div className="text-lg font-semibold">{person.fullname || '—'}</div>
          <div className="mt-1 text-xs text-slate-500">
            {[
              person.nationalId ? `ת"ז: ${person.nationalId}` : null,
              person.phones.length > 0 ? `טלפון: ${person.phones.join(', ')}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>

        {openAlerts.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
            <div className="mb-2 text-sm font-medium text-amber-800">
              התראות פתוחות ({openAlerts.length})
            </div>
            <ul className="space-y-2">
              {openAlerts.map((a) => (
                <li
                  key={a.id}
                  className="rounded-md border border-amber-200/60 bg-white/70 p-2 text-xs"
                >
                  <div className="font-medium text-amber-800">
                    {ALERT_LABELS[a.kind]}
                  </div>
                  {a.details.mismatchedFields.length > 0 && (
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      שדות שונים:{' '}
                      {a.details.mismatchedFields
                        .map((f) =>
                          f === 'id' ? 'תעודת זהות' : f === 'name' ? 'שם' : 'טלפון',
                        )
                        .join(' · ')}
                    </div>
                  )}
                  {a.relatedPerson ? (
                    <div className="mt-1.5 rounded-md border border-amber-200/70 bg-amber-50/40 p-2">
                      <div className="text-[11px] text-slate-500">
                        התנגשות עם אזרח קיים:
                      </div>
                      <div className="font-medium text-slate-900">
                        {a.relatedPerson.fullname || '—'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {[
                          a.relatedPerson.nationalId
                            ? `ת"ז: ${a.relatedPerson.nationalId}`
                            : null,
                          a.relatedPerson.phones.length > 0
                            ? `טלפון: ${a.relatedPerson.phones.join(', ')}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </div>
                      <div className="mt-1">
                        <Link
                          to={`/citizens/${a.relatedPerson.id}`}
                          className="text-[11px] text-sky-700 underline hover:text-sky-800"
                        >
                          פתח את האזרח השני
                        </Link>
                      </div>
                    </div>
                  ) : (
                    a.details.incoming && (
                      <div className="mt-1 text-[11px] text-slate-500">
                        נתון נכנס:{' '}
                        {[
                          a.details.incoming.fullname,
                          a.details.incoming.id,
                          a.details.incoming.phone?.join(', '),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border border-border/70 bg-card/50 p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="nationalId" className="text-sm font-medium">
                תעודת זהות
              </label>
              <input
                id="nationalId"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="fullname" className="text-sm font-medium">
                שם מלא
              </label>
              <input
                id="fullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">טלפונים</span>
            <ul className="space-y-1">
              {phoneRows.length === 0 && (
                <li className="text-xs text-slate-500">אין טלפונים</li>
              )}
              {phoneRows.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-1.5 text-sm"
                >
                  <input
                    value={row.value}
                    onChange={(e) => updatePhoneRow(row.key, e.target.value)}
                    placeholder="טלפון"
                    className="flex-1 rounded-md border border-border/40 bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => removePhoneRow(row.key)}
                  >
                    הסר
                  </Button>
                </li>
              ))}
            </ul>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPhoneRow}
                disabled={lastRowEmpty}
              >
                + הוסף טלפון
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="reason" className="text-sm font-medium">
              סיבת השינוי (אופציונלי, אך חובה למיזוג)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              placeholder='למשל: "שוחחתי עם האזרח בטלפון, שמו האמיתי..."'
            />
          </div>

          {error && (
            <div role="alert" className="text-sm text-destructive">
              {error}
            </div>
          )}
          {savedNotice && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-800">
              {savedNotice}
            </div>
          )}

          {conflicts && conflicts.length > 0 && person && (
            <MergeConfirmation
              survivor={person}
              candidate={{
                nationalId: nationalId.trim() || null,
                fullname: fullname.trim() || null,
                phones: currentTrimmedPhones,
              }}
              others={others}
              reason={reason}
              onReasonChange={setReason}
              onMerged={async (merged) => {
                setConflicts(null)
                setSavedNotice(`המיזוג בוצע בהצלחה`)
                setReason('')
                if (merged.id === person.id) {
                  await load()
                } else {
                  navigate(`/citizens/${merged.id}`)
                }
              }}
              onCancel={() => setConflicts(null)}
            />
          )}

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleting((v) => !v)
                setDeleteError(null)
              }}
              className="text-destructive hover:bg-destructive/5"
            >
              {deleting ? 'סגור' : 'מחק אזרח'}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'שומר...' : 'שמירה'}
            </Button>
          </div>

          {deleting && (
            <div className="space-y-3 rounded-md border-2 border-destructive/40 bg-destructive/5 p-4">
              <div className="text-sm font-semibold text-destructive">
                מחיקת אזרח לצמיתות
              </div>
              <div className="text-xs leading-relaxed text-slate-700">
                פעולה זו אינה הפיכה. הטלפונים, ההיסטוריה ושיוך לדפי הקשר של
                האזרח יימחקו. נשמור רשומה אחת בלוג עם הסיבה והמשתמש שביצע את
                המחיקה, לצורך ביקורת.
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">סיבת המחיקה (חובה)</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-destructive/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-destructive"
                  placeholder='למשל: "כפילות עם אזרח אחר, התבקש על ידי הרכז"'
                />
              </div>
              {deleteError && (
                <div className="text-xs text-destructive">{deleteError}</div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onConfirmDelete}
                  disabled={deleteBusy || !deleteReason.trim()}
                >
                  {deleteBusy ? 'מוחק...' : 'מחק לצמיתות'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleting(false)
                    setDeleteReason('')
                    setDeleteError(null)
                  }}
                  disabled={deleteBusy}
                >
                  ביטול
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="rounded-lg border border-border/70 bg-card/50 p-4">
          <div className="mb-3 text-sm font-medium">היסטוריית שינויים</div>
          {history.length === 0 ? (
            <p className="text-xs text-slate-500">אין שינויים מתועדים</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-slate-500">
                    <th className="px-2 py-1.5 font-medium">שדה</th>
                    <th className="px-2 py-1.5 font-medium">קודם</th>
                    <th className="px-2 py-1.5 font-medium">חדש</th>
                    <th className="px-2 py-1.5 font-medium">סיבה</th>
                    <th className="px-2 py-1.5 font-medium">משתמש</th>
                    <th className="px-2 py-1.5 font-medium">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      <td className="px-2 py-1.5 font-medium">
                        {FIELD_LABELS[h.field]}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">
                        {h.field === 'merged_from'
                          ? 'מזהה: ' + (h.oldValue ?? '—')
                          : h.oldValue ?? '—'}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">
                        {h.field === 'merged_from' || h.field === 'deleted'
                          ? renderMergedSummary(h.newValue)
                          : h.newValue ?? '—'}
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">
                        {h.reason ?? '—'}
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">
                        {h.user?.username ?? '—'}
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">
                        {new Date(h.createdAt).toLocaleString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function renderMergedSummary(raw: string | null): string {
  if (!raw) return '—'
  try {
    const parsed = JSON.parse(raw) as {
      fullname?: string | null
      nationalId?: string | null
      phones?: string[]
    }
    return [
      parsed.fullname,
      parsed.nationalId ? `ת"ז: ${parsed.nationalId}` : null,
      parsed.phones && parsed.phones.length > 0
        ? `טלפון: ${parsed.phones.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ') || '—'
  } catch {
    return raw
  }
}
