import { Fragment, useCallback, useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import {
  generateContactPage,
  getContactPage,
  listContactPages,
  type AlertKind,
  type ContactPage,
  type ContactPageEntry,
  type ContactPageSummary,
  type CrossPageWarning,
} from '../lib/api'
import { ALERT_LABELS } from '../lib/alert-labels'
import { Button } from '@/components/ui/button'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type EntryGroup =
  | { kind: 'single'; entry: ContactPageEntry }
  | { kind: 'pair'; groupId: string; entries: ContactPageEntry[] }

function groupEntries(entries: ContactPageEntry[]): EntryGroup[] {
  const pairMap = new Map<string, ContactPageEntry[]>()
  for (const e of entries) {
    if (e.pairGroupId) {
      const list = pairMap.get(e.pairGroupId) ?? []
      list.push(e)
      pairMap.set(e.pairGroupId, list)
    }
  }

  const groups: EntryGroup[] = []
  const seenPairs = new Set<string>()
  for (const e of entries) {
    if (!e.pairGroupId) {
      groups.push({ kind: 'single', entry: e })
    } else if (!seenPairs.has(e.pairGroupId)) {
      seenPairs.add(e.pairGroupId)
      groups.push({
        kind: 'pair',
        groupId: e.pairGroupId,
        entries: pairMap.get(e.pairGroupId) ?? [],
      })
    }
  }
  return groups
}

// ─── table sub-components ────────────────────────────────────────────────────

function WarningNote({ w }: { w: CrossPageWarning }) {
  const reason = ALERT_LABELS[w.alertKind as AlertKind] ?? w.alertKind
  return (
    <tr className="bg-orange-50 text-xs print:bg-orange-50">
      <td className="border-b border-orange-100 py-1" />
      <td colSpan={4} className="border-b border-orange-100 px-3 py-1 text-orange-700">
        ⚠️ חשד לכפילות עם{' '}
        <strong>{w.otherFullname ?? 'לא ידוע'}</strong>
        {w.otherNationalId ? ` (ת.ז. ${w.otherNationalId})` : ''}
        {reason ? <> — <span className="font-medium">{reason}</span></> : null}
        {' '}— נמסר בדף&nbsp;#{w.otherPageNumber} למשתמש{' '}
        <strong>{w.otherCreatedByUsername}</strong>. יש לאמת ולעדכן.
      </td>
    </tr>
  )
}

function EntryRow({
  entry,
  num,
  isPair = false,
}: {
  entry: ContactPageEntry
  num: number
  isPair?: boolean
}) {
  const rowCls = isPair
    ? 'border-b border-amber-200 bg-amber-50/40 print:bg-amber-50'
    : 'border-b border-slate-100'
  return (
    <Fragment>
      <tr className={rowCls}>
        <td className="w-8 px-2 py-2 text-center text-xs text-slate-400">{num}</td>
        <td className="px-3 py-2 font-medium">{entry.fullname ?? '—'}</td>
        <td className="px-3 py-2 font-mono text-slate-700">{entry.nationalId ?? '—'}</td>
        <td className="px-3 py-2 text-slate-700">{entry.phones.join(' / ') || '—'}</td>
        <td className="px-3 py-2 text-center text-slate-300">□</td>
      </tr>
      {entry.crossPageWarnings.map((w, wi) => (
        <WarningNote key={wi} w={w} />
      ))}
    </Fragment>
  )
}

function PageTable({ entries }: { entries: ContactPageEntry[] }) {
  const groups = groupEntries(entries)
  let counter = 0

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-slate-300 bg-slate-50 text-right text-slate-700 print:bg-slate-100">
          <th className="w-8 px-2 py-2 text-center">#</th>
          <th className="px-3 py-2">שם מלא</th>
          <th className="px-3 py-2">תעודת זהות</th>
          <th className="px-3 py-2">טלפון</th>
          <th className="w-10 px-3 py-2 text-center">✓</th>
        </tr>
      </thead>
      {groups.map((group, gi) => {
        if (group.kind === 'single') {
          const num = ++counter
          return (
            <tbody key={gi}>
              <EntryRow entry={group.entry} num={num} />
            </tbody>
          )
        }

        const start = counter + 1
        counter += group.entries.length
        return (
          <tbody key={gi}>
            <tr className="bg-amber-100 print:bg-amber-100">
              <td
                colSpan={5}
                className="border-t-2 border-amber-400 px-3 py-1 text-xs font-semibold text-amber-800"
              >
                ⚠️ יש לאמת — חשד לכפילות: שתי הרשומות הבאות עשויות להיות אותו אדם
              </td>
            </tr>
            {group.entries.map((entry, ei) => (
              <EntryRow key={entry.personId} entry={entry} num={start + ei} isPair />
            ))}
            <tr className="bg-amber-100 print:bg-amber-100">
              <td colSpan={5} className="border-b-2 border-amber-400 py-0.5" />
            </tr>
          </tbody>
        )
      })}
    </table>
  )
}

// ─── detail view ─────────────────────────────────────────────────────────────

function PageDetail({
  page,
  onBack,
}: {
  page: ContactPage
  onBack: () => void
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← חזרה לרשימה
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          הדפס
        </Button>
      </div>

      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold">דף קשר #{page.pageNumber}</h2>
        <p className="text-sm text-slate-500">
          עונה: {page.season} · {formatDate(page.createdAt)}
        </p>
      </div>

      {page.entries.length === 0 ? (
        <p className="text-slate-500">אין רשומות בדף זה.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white print:border-0">
          <PageTable entries={page.entries} />
        </div>
      )}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ContactSheets() {
  const [pages, setPages] = useState<ContactPageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState<ContactPage | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingPage, setLoadingPage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listContactPages()
      setPages(list)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  async function onGenerate() {
    setError(null)
    setGenerating(true)
    try {
      const page = await generateContactPage()
      setActivePage(page)
      void loadList()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  async function onSelectPage(id: string) {
    setError(null)
    setLoadingPage(true)
    try {
      const page = await getContactPage(id)
      setActivePage(page)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingPage(false)
    }
  }

  if (activePage) {
    return (
      <AppLayout title="דפי קשר">
        <PageDetail page={activePage} onBack={() => setActivePage(null)} />
      </AppLayout>
    )
  }

  return (
    <AppLayout title="דפי קשר">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {loading
              ? ''
              : pages.length === 0
                ? 'אין דפי קשר קיימים.'
                : `${pages.length} דפים`}
          </p>
          <Button onClick={onGenerate} disabled={generating || loading}>
            {generating ? 'יוצר דף...' : '+ צור דף קשר חדש'}
          </Button>
        </div>

        {error && (
          <div role="alert" className="text-sm text-destructive">
            {error}
          </div>
        )}

        {loading || loadingPage ? (
          <p className="text-sm text-slate-500">טוען...</p>
        ) : pages.length > 0 ? (
          <ul className="divide-y divide-border/70 rounded-lg border border-border/70 bg-card/50">
            {pages.map((p) => (
              <li
                key={p.id}
                className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                onClick={() => void onSelectPage(p.id)}
              >
                <div className="space-y-0.5">
                  <div className="font-medium">דף #{p.pageNumber}</div>
                  <div className="text-xs text-slate-500">
                    עונה: {p.season} · {formatDate(p.createdAt)}
                  </div>
                </div>
                <span className="text-xs text-slate-400">פתח ←</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </AppLayout>
  )
}
