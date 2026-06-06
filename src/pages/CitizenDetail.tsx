import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import {
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
}

export default function CitizenDetail() {
  const { id } = useParams<{ id: string }>()
  const [person, setPerson] = useState<PersonWithPhones | null>(null)
  const [openAlerts, setOpenAlerts] = useState<Alert[]>([])
  const [history, setHistory] = useState<PersonHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [nationalId, setNationalId] = useState('')
  const [fullname, setFullname] = useState('')
  const [phones, setPhones] = useState<string[]>([])
  const [newPhone, setNewPhone] = useState('')
  const [reason, setReason] = useState('')
  const [removed, setRemoved] = useState<string[]>([])

  const [busy, setBusy] = useState(false)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ConflictDetail[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      setPhones(result.person.phones)
      setRemoved([])
      const h = await getPersonHistory(id)
      setHistory(h)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  function removePhone(raw: string) {
    setPhones((curr) => curr.filter((p) => p !== raw))
    setRemoved((curr) => (curr.includes(raw) ? curr : [...curr, raw]))
  }

  function addPhone() {
    const v = newPhone.trim()
    if (!v) return
    if (phones.includes(v)) {
      setNewPhone('')
      return
    }
    setPhones((curr) => [...curr, v])
    setNewPhone('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id || !person) return
    setBusy(true)
    setError(null)
    setConflicts(null)
    setSavedNotice(null)

    const originalPhones = new Set(person.phones)
    const currentPhones = new Set(phones)
    const addPhones = phones.filter((p) => !originalPhones.has(p))
    const removePhones = removed.filter((p) => !currentPhones.has(p))

    const input: Parameters<typeof updatePerson>[1] = {}
    const trimmedNationalId = nationalId.trim()
    const newNationalId = trimmedNationalId === '' ? null : trimmedNationalId
    if (newNationalId !== person.nationalId) input.nationalId = newNationalId

    const trimmedFullname = fullname.trim()
    const newFullname = trimmedFullname === '' ? null : trimmedFullname
    if (newFullname !== person.fullname) input.fullname = newFullname

    if (addPhones.length > 0 || removePhones.length > 0) {
      input.phones = {}
      if (addPhones.length > 0) input.phones.add = addPhones
      if (removePhones.length > 0) input.phones.remove = removePhones
    }
    if (reason.trim()) input.reason = reason.trim()

    if (Object.keys(input).length === 0 || (Object.keys(input).length === 1 && 'reason' in input)) {
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
            <ul className="space-y-1.5">
              {openAlerts.map((a) => (
                <li key={a.id} className="text-xs text-slate-700">
                  <span className="font-medium text-amber-800">
                    {ALERT_LABELS[a.kind]}
                  </span>
                  {a.details.incoming && (
                    <span className="mr-2 text-slate-500">
                      ({
                        [
                          a.details.incoming.fullname,
                          a.details.incoming.id,
                          a.details.incoming.phone?.join(', '),
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      })
                    </span>
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
              {phones.length === 0 && (
                <li className="text-xs text-slate-500">אין טלפונים</li>
              )}
              {phones.map((p) => (
                <li
                  key={p}
                  className="flex items-center justify-between rounded-md border border-border/70 bg-background px-3 py-1.5 text-sm"
                >
                  <span>{p}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => removePhone(p)}
                  >
                    הסר
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="טלפון חדש"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
              <Button type="button" variant="outline" onClick={addPhone}>
                הוסף
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="reason" className="text-sm font-medium">
              סיבת השינוי (אופציונלי)
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

          {conflicts && conflicts.length > 0 && (
            <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <div className="text-sm font-medium text-destructive">
                לא ניתן לשמור — נמצא אזרח אחר עם פרטים חופפים:
              </div>
              <ul className="space-y-2">
                {conflicts.map((c, i) => (
                  <li
                    key={c.otherPerson.id + i}
                    className="rounded-md border border-border/70 bg-background p-3 text-sm"
                  >
                    <div className="font-medium">
                      {c.otherPerson.fullname || '—'}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {[
                        c.otherPerson.nationalId
                          ? `ת"ז: ${c.otherPerson.nationalId}`
                          : null,
                        c.otherPerson.phones.length > 0
                          ? `טלפון: ${c.otherPerson.phones.join(', ')}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div className="mt-0.5 text-xs text-amber-700">
                      {ALERT_LABELS[c.kind] ?? c.kind}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/citizens/${c.otherPerson.id}`}>
                          פתח את האזרח
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link
                          to={`/citizens/merge?survivor=${encodeURIComponent(
                            person.id,
                          )}&victim=${encodeURIComponent(c.otherPerson.id)}`}
                        >
                          מיזוג עם אזרח זה
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? 'שומר...' : 'שמירה'}
            </Button>
          </div>
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
                        {h.field === 'merged_from'
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
