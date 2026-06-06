import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { getPerson, mergePersons, type PersonWithPhones } from '../lib/api'

export default function CitizensMerge() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const survivorId = searchParams.get('survivor')
  const victimId = searchParams.get('victim')

  const [survivor, setSurvivor] = useState<PersonWithPhones | null>(null)
  const [victim, setVictim] = useState<PersonWithPhones | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [resolvedId, setResolvedId] = useState<'survivor' | 'victim' | 'new'>('survivor')
  const [customId, setCustomId] = useState('')
  const [resolvedName, setResolvedName] = useState<'survivor' | 'victim' | 'new'>('survivor')
  const [customName, setCustomName] = useState('')
  const [phonesToKeep, setPhonesToKeep] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [confirmDifferentIds, setConfirmDifferentIds] = useState(false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!survivorId || !victimId) {
        setNotFound(true)
        return
      }
      setLoading(true)
      try {
        const s = await getPerson(survivorId)
        const v = await getPerson(victimId)
        if (!s || !v) {
          setNotFound(true)
          return
        }
        setSurvivor(s.person)
        setVictim(v.person)
        setResolvedId('survivor')
        setResolvedName('survivor')
        const union = new Set([...s.person.phones, ...v.person.phones])
        setPhonesToKeep(Array.from(union).sort())
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [survivorId, victimId])

  if (loading) {
    return (
      <AppLayout title="מיזוג אזרחים">
        <p className="text-sm text-slate-500">טוען...</p>
      </AppLayout>
    )
  }

  if (notFound || !survivor || !victim) {
    return (
      <AppLayout title="מיזוג אזרחים">
        <div className="space-y-3">
          <p className="text-sm text-destructive">אחד או שניים מהאזרחים לא נמצאו</p>
          <Button variant="outline" asChild>
            <Link to="/citizens">חזרה לחיפוש</Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  const differentIds =
    survivor.nationalId &&
    victim.nationalId &&
    survivor.nationalId !== victim.nationalId

  function togglePhone(raw: string) {
    setPhonesToKeep((curr) =>
      curr.includes(raw) ? curr.filter((p) => p !== raw) : [...curr, raw],
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    const id =
      resolvedId === 'survivor'
        ? survivor!.nationalId ?? null
        : resolvedId === 'victim'
          ? victim!.nationalId ?? null
          : customId.trim() || null

    const name =
      resolvedName === 'survivor'
        ? survivor!.fullname ?? null
        : resolvedName === 'victim'
          ? victim!.fullname ?? null
          : customName.trim() || null

    try {
      const result = await mergePersons({
        survivorId: survivor!.id,
        victimId: victim!.id,
        resolved: { nationalId: id, fullname: name },
        phonesToKeep,
        reason: reason.trim(),
        confirmDifferentIds,
      })

      if (!result.ok) {
        if (result.error === 'missing_reason') {
          setError('חובה להזין סיבה למיזוג')
        } else if (result.error === 'confirm_required') {
          setError('יש לאשר שתעודות הזהות שונות')
        } else {
          setError(result.error)
        }
        return
      }

      navigate(`/citizens/${result.person.id}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const survivorPhones = new Set(survivor!.phones)

  return (
    <AppLayout title="מיזוג אזרחים">
      <div className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Survivor */}
            <div className="rounded-lg border-2 border-sky-200 bg-sky-50/30 p-4">
              <div className="mb-2 text-sm font-bold text-sky-800">שורד</div>
              <div className="text-lg font-semibold">{survivor.fullname || '—'}</div>
              <div className="mt-0.5 text-xs text-slate-600">
                {survivor.nationalId ? `ת"ז: ${survivor.nationalId}` : '—'}
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                טלפונים: {survivor.phones.length > 0 ? survivor.phones.join(', ') : '—'}
              </div>
            </div>

            {/* Victim */}
            <div className="rounded-lg border-2 border-amber-200 bg-amber-50/30 p-4">
              <div className="mb-2 text-sm font-bold text-amber-800">מועמד למחיקה</div>
              <div className="text-lg font-semibold">{victim.fullname || '—'}</div>
              <div className="mt-0.5 text-xs text-slate-600">
                {victim.nationalId ? `ת"ז: ${victim.nationalId}` : '—'}
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                טלפונים: {victim.phones.length > 0 ? victim.phones.join(', ') : '—'}
              </div>
            </div>
          </div>

          {/* Resolve ID */}
          <div className="space-y-2 rounded-lg border border-border/70 bg-card/50 p-4">
            <div className="text-sm font-medium">תעודת זהות בסופי המיזוג</div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={resolvedId === 'survivor'}
                  onChange={() => setResolvedId('survivor')}
                />
                מהשורד: {survivor.nationalId || 'אין'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={resolvedId === 'victim'}
                  onChange={() => setResolvedId('victim')}
                />
                מהמועמד: {victim.nationalId || 'אין'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={resolvedId === 'new'}
                  onChange={() => setResolvedId('new')}
                />
                ערך חדש:
              </label>
              {resolvedId === 'new' && (
                <input
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="תעודת זהות חדשה"
                  className="ml-5 rounded-md border border-border bg-background px-2 py-1 text-sm"
                />
              )}
            </div>
          </div>

          {/* Resolve Name */}
          <div className="space-y-2 rounded-lg border border-border/70 bg-card/50 p-4">
            <div className="text-sm font-medium">שם בסופי המיזוג</div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={resolvedName === 'survivor'}
                  onChange={() => setResolvedName('survivor')}
                />
                מהשורד: {survivor.fullname || 'אין'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={resolvedName === 'victim'}
                  onChange={() => setResolvedName('victim')}
                />
                מהמועמד: {victim.fullname || 'אין'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={resolvedName === 'new'}
                  onChange={() => setResolvedName('new')}
                />
                ערך חדש:
              </label>
              {resolvedName === 'new' && (
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="שם חדש"
                  className="ml-5 rounded-md border border-border bg-background px-2 py-1 text-sm"
                />
              )}
            </div>
          </div>

          {/* Phones */}
          <div className="space-y-2 rounded-lg border border-border/70 bg-card/50 p-4">
            <div className="text-sm font-medium">טלפונים לשמור</div>
            <ul className="space-y-1">
              {phonesToKeep.length === 0 && (
                <li className="text-xs text-slate-500">לא נבחרו טלפונים</li>
              )}
              {[...new Set([...survivor.phones, ...victim.phones])].map((phone) => (
                <li key={phone} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={phonesToKeep.includes(phone)}
                    onChange={() => togglePhone(phone)}
                  />
                  <span>{phone}</span>
                  <span className="text-xs text-slate-500">
                    ({survivorPhones.has(phone) ? 'שורד' : 'מועמד'})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reason */}
          <div className="space-y-2 rounded-lg border border-border/70 bg-card/50 p-4">
            <label htmlFor="reason" className="text-sm font-medium">
              סיבת המיזוג (חובה)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              placeholder='למשל: "יש לנו שתי שורות של אותו אדם מאקסל שונה..."'
            />
          </div>

          {/* Confirm different IDs */}
          {differentIds && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmDifferentIds}
                  onChange={(e) => setConfirmDifferentIds(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  אני מאשר/ת — תעודות הזהות שונות אך זה אותו אדם
                  <div className="mt-1 text-xs text-amber-700">
                    שורד: {survivor.nationalId} | מועמד: {victim.nationalId}
                  </div>
                </span>
              </label>
            </div>
          )}

          {error && (
            <div role="alert" className="text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild disabled={busy}>
              <Link to="/citizens">ביטול</Link>
            </Button>
            <Button
              type="submit"
              disabled={
                busy ||
                !reason.trim() ||
                (differentIds && !confirmDifferentIds) ||
                phonesToKeep.length === 0
              }
              onClick={() => {
                if (!confirm('פעולה זו אינה הפיכה. להמשיך?')) return
              }}
            >
              {busy ? 'מיזוג...' : 'מיזוג'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
