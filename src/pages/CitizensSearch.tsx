import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { searchPersons, type SearchBy, type SearchHit } from '../lib/api'

const BY_OPTIONS: { value: SearchBy; label: string }[] = [
  { value: 'auto', label: 'אוטומטי' },
  { value: 'id', label: 'תעודת זהות' },
  { value: 'phone', label: 'טלפון' },
  { value: 'name', label: 'שם' },
]

export default function CitizensSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [by, setBy] = useState<SearchBy>('auto')
  const [myPagesOnly, setMyPagesOnly] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])

  const [mergeMode, setMergeMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const showMyPagesOnly = by === 'auto' || by === 'name'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    setError(null)
    try {
      const r = await searchPersons(query.trim(), by, showMyPagesOnly && myPagesOnly)
      setHits(r.hits)
      setSearched(true)
      setSelected([])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function toggleSelected(id: string) {
    setSelected((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id)
      if (curr.length >= 2) return [curr[1], id]
      return [...curr, id]
    })
  }

  function goMerge() {
    if (selected.length !== 2) return
    navigate(
      `/citizens/merge?survivor=${encodeURIComponent(selected[0])}&victim=${encodeURIComponent(selected[1])}`,
    )
  }

  return (
    <AppLayout title="עדכון אזרחים">
      <div className="space-y-6">
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-lg border border-border/70 bg-card/50 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label htmlFor="q" className="text-sm font-medium">
                חיפוש
              </label>
              <input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="תעודת זהות / טלפון / שם"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </div>
            <Button type="submit" disabled={busy || !query.trim()}>
              {busy ? 'מחפש...' : 'חיפוש'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-600">סוג חיפוש:</span>
            <div className="flex flex-wrap gap-1">
              {BY_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setBy(opt.value)}
                  className={
                    'rounded-md border px-3 py-1 text-xs transition ' +
                    (by === opt.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-border/70 bg-background text-slate-600 hover:border-sky-300')
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {showMyPagesOnly && (
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={myPagesOnly}
                  onChange={(e) => setMyPagesOnly(e.target.checked)}
                />
                רק אזרחים בדפי הקשר שלי
              </label>
            )}
          </div>
        </form>

        {error && (
          <div role="alert" className="text-sm text-destructive">
            {error}
          </div>
        )}

        {searched && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {hits.length === 0 ? 'לא נמצאו תוצאות' : `נמצאו ${hits.length} תוצאות`}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={mergeMode}
                    onChange={(e) => {
                      setMergeMode(e.target.checked)
                      setSelected([])
                    }}
                  />
                  מצב מיזוג
                </label>
                {mergeMode && selected.length === 2 && (
                  <Button size="sm" onClick={goMerge}>
                    מיזוג שני אזרחים
                  </Button>
                )}
              </div>
            </div>

            {hits.length > 0 && (
              <ul className="divide-y divide-border/70 rounded-lg border border-border/70 bg-card/50">
                {hits.map((h) => {
                  const isSelected = selected.includes(h.person.id)
                  const rowClass =
                    'flex items-center justify-between gap-3 px-4 py-3 text-sm transition ' +
                    (isSelected ? 'bg-sky-50' : 'hover:bg-muted/40')
                  return (
                    <li key={h.person.id} className={rowClass}>
                      <div className="flex flex-1 items-center gap-3">
                        {mergeMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelected(h.person.id)}
                            aria-label="בחר למיזוג"
                          />
                        )}
                        <Link
                          to={`/citizens/${h.person.id}#data-errors`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              {h.person.fullname || '—'}
                            </span>
                            {h.openAlertCount > 0 && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800"
                                title={`${h.openAlertCount} שגיאות נתונים פתוחות`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                {h.openAlertCount} שגיאות נתונים
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {[
                              h.person.nationalId
                                ? `ת"ז: ${h.person.nationalId}`
                                : null,
                              h.person.phones.length > 0
                                ? `טלפון: ${h.person.phones.join(', ')}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
