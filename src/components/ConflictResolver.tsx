import { useMemo, useState } from 'react'
import {
  resolveConflict,
  type CommitResult,
  type Contact,
  type PersonWithPhones,
} from '@/lib/api'
import { Button } from './ui/button'

type Conflict = CommitResult['conflicts'][number]

type Props = {
  conflicts: Conflict[]
  fileName: string
  onDone: (stats: {
    newCount: number
    mergeCount: number
    skipCount: number
  }) => void
}

type Stats = { newCount: number; mergeCount: number; skipCount: number }

type EditableContact = {
  id: string
  fullname: string
  phones: string[]
}

function toEditable(c: Contact): EditableContact {
  return {
    id: c.id ?? '',
    fullname: c.fullname ?? '',
    phones: c.phone.length > 0 ? [...c.phone] : [''],
  }
}

function fromEditable(e: EditableContact): Contact {
  return {
    id: e.id.trim() || null,
    fullname: e.fullname.trim() || null,
    phone: e.phones.map((p) => p.trim()).filter(Boolean),
  }
}

export default function ConflictResolver({
  conflicts,
  fileName,
  onDone,
}: Props) {
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState<Stats>({
    newCount: 0,
    mergeCount: 0,
    skipCount: 0,
  })
  const [busy, setBusy] = useState(false)
  const [edits, setEdits] = useState<EditableContact>(() =>
    toEditable(conflicts[0]?.incoming ?? { id: null, fullname: null, phone: [] })
  )
  const [bulkBusy, setBulkBusy] = useState(false)

  const current = conflicts[index]
  const total = conflicts.length

  function advance(updatedStats: Stats) {
    const next = index + 1
    if (next >= total) {
      onDone(updatedStats)
      return
    }
    setIndex(next)
    setEdits(toEditable(conflicts[next].incoming))
  }

  async function resolveOne(
    action: 'merge' | 'new' | 'skip',
    targetPersonId?: string
  ) {
    if (!current) return
    setBusy(true)
    try {
      const incoming = fromEditable(edits)
      if (action === 'skip') {
        await resolveConflict({ action: 'skip' })
      } else if (action === 'new') {
        await resolveConflict({
          action: 'new',
          incoming,
          sourceFile: fileName,
        })
      } else {
        if (!targetPersonId) throw new Error('missing target')
        await resolveConflict({
          action: 'merge',
          targetPersonId,
          incoming,
        })
      }
      const updated: Stats = {
        newCount: stats.newCount + (action === 'new' ? 1 : 0),
        mergeCount: stats.mergeCount + (action === 'merge' ? 1 : 0),
        skipCount: stats.skipCount + (action === 'skip' ? 1 : 0),
      }
      setStats(updated)
      advance(updated)
    } finally {
      setBusy(false)
    }
  }

  async function bulk(action: 'new' | 'skip') {
    setBulkBusy(true)
    let acc = stats
    try {
      for (let i = index; i < total; i++) {
        const c = conflicts[i]
        if (action === 'new') {
          await resolveConflict({
            action: 'new',
            incoming: c.incoming,
            sourceFile: fileName,
          })
          acc = { ...acc, newCount: acc.newCount + 1 }
        } else {
          await resolveConflict({ action: 'skip' })
          acc = { ...acc, skipCount: acc.skipCount + 1 }
        }
      }
      setStats(acc)
      onDone(acc)
    } finally {
      setBulkBusy(false)
    }
  }

  function updatePhone(i: number, value: string) {
    setEdits((prev) => {
      const phones = [...prev.phones]
      phones[i] = value
      return { ...prev, phones }
    })
  }

  function addPhone() {
    setEdits((prev) => ({ ...prev, phones: [...prev.phones, ''] }))
  }

  function removePhone(i: number) {
    setEdits((prev) => ({
      ...prev,
      phones: prev.phones.length === 1 ? [''] : prev.phones.filter((_, idx) => idx !== i),
    }))
  }

  const phoneOverlap = useMemo(() => {
    if (!current) return new Set<string>()
    const incomingPhones = new Set(edits.phones.map((p) => p.trim()))
    const overlap = new Set<string>()
    for (const cand of current.candidates) {
      for (const p of cand.phones) {
        if (incomingPhones.has(p)) overlap.add(p)
      }
    }
    return overlap
  }, [current, edits.phones])

  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">
            פתרון התנגשויות
          </h2>
          <p className="text-xs text-slate-500">
            התנגשות {index + 1} מתוך {total} · מספר טלפון קיים אצל אדם אחר
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={bulkBusy || busy}
            onClick={() => bulk('new')}
          >
            הוסף את כל הנותרים כחדשים
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={bulkBusy || busy}
            onClick={() => bulk('skip')}
          >
            דלג על הכל
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-sky-300 bg-sky-50/40 p-4">
          <div className="mb-3 text-xs font-medium text-sky-700">
            איש קשר חדש (ניתן לעריכה)
          </div>
          <label className="block text-xs text-slate-500">שם מלא</label>
          <input
            className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-1 text-sm"
            value={edits.fullname}
            onChange={(e) =>
              setEdits((p) => ({ ...p, fullname: e.target.value }))
            }
          />
          <label className="mt-3 block text-xs text-slate-500">תעודת זהות</label>
          <input
            className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-1 text-sm"
            value={edits.id}
            onChange={(e) => setEdits((p) => ({ ...p, id: e.target.value }))}
          />
          <label className="mt-3 block text-xs text-slate-500">טלפונים</label>
          <div className="mt-1 space-y-1">
            {edits.phones.map((p, i) => (
              <div key={i} className="flex gap-1">
                <input
                  className={`flex-1 rounded-md border bg-background px-2 py-1 text-sm ${
                    phoneOverlap.has(p.trim())
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-border/70'
                  }`}
                  value={p}
                  onChange={(e) => updatePhone(i, e.target.value)}
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => removePhone(i)}
                  aria-label="הסר טלפון"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button size="xs" variant="outline" onClick={addPhone}>
              הוסף טלפון
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {current.candidates.map((cand) => (
            <CandidateCard
              key={cand.id}
              cand={cand}
              overlap={phoneOverlap}
              disabled={busy || bulkBusy}
              onMerge={() => resolveOne('merge', cand.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          disabled={busy || bulkBusy}
          onClick={() => resolveOne('skip')}
        >
          דלג
        </Button>
        <Button
          variant="outline"
          disabled={busy || bulkBusy}
          onClick={() => resolveOne('new')}
        >
          הוסף כאיש חדש
        </Button>
      </div>
    </div>
  )
}

function CandidateCard({
  cand,
  overlap,
  disabled,
  onMerge,
}: {
  cand: PersonWithPhones
  overlap: Set<string>
  disabled: boolean
  onMerge: () => void
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-4">
      <div className="mb-1 text-xs font-medium text-slate-500">איש קיים</div>
      <div className="text-sm font-medium text-slate-700">
        {cand.fullname ?? '—'}
      </div>
      <div className="text-xs text-slate-500">
        ת״ז: {cand.nationalId ?? '—'}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {cand.phones.map((p) => (
          <span
            key={p}
            className={`rounded-md px-2 py-0.5 text-xs ${
              overlap.has(p)
                ? 'bg-amber-100 text-amber-800'
                : 'bg-muted text-slate-600'
            }`}
          >
            {p}
          </span>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={disabled} onClick={onMerge}>
          מזג לאיש זה
        </Button>
      </div>
    </div>
  )
}
