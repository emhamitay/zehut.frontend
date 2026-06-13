import { useCallback, useEffect, useState, type FormEvent } from 'react'
import AppLayout from '../components/layout/AppLayout'
import {
  createUser,
  deleteUser,
  listUsers,
  type AuthUser,
} from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { Button } from '@/components/ui/button'
import { SparkIcon, UsersIcon, WarningIcon } from '@/components/icons'
import PasswordField from '@/components/PasswordField'

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listUsers()
      setUsers(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await createUser(username, password)
      setUsername('')
      setPassword('')
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string) {
    setError(null)
    if (!confirm('למחוק את המשתמש?')) return
    try {
      await deleteUser(id)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <AppLayout title="משתמשים">
      <div className="space-y-6">
        <section className="rounded-xl border border-sky-200/70 bg-[linear-gradient(135deg,rgba(224,242,254,0.65),rgba(255,255,255,0.92))] p-4">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-sky-900">
            <UsersIcon className="h-4 w-4" />
            ניהול משתמשים
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            לכל איש צוות מומלץ משתמש אישי, כדי לשמור על מעקב ברור בדפי הקשר ובפעולות שבוצעו.
          </p>
        </section>

        <form
          onSubmit={onCreate}
          className="grid gap-3 rounded-xl border border-border/70 bg-white/80 p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-1">
            <label htmlFor="new-username" className="text-sm font-medium">
              שם משתמש
            </label>
            <input
              id="new-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-sm font-medium">
              סיסמה
            </label>
            <PasswordField
              id="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="sm:mb-px">
            {busy ? 'מוסיף...' : 'הוסף משתמש'}
          </Button>
        </form>

        {error && (
          <div role="alert" className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <WarningIcon className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">טוען...</p>
        ) : (
          <ul
            data-testid="users-list"
            className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-white/85 shadow-sm"
          >
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-sky-50/45"
              >
                <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                  <UsersIcon className="h-4 w-4 text-sky-600" />
                  {u.username}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(u.id)}
                  disabled={u.id === me?.id}
                  title={u.id === me?.id ? 'לא ניתן למחוק את עצמך' : undefined}
                >
                  מחק
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="inline-flex items-center gap-1 text-xs text-slate-500">
          <SparkIcon className="h-3.5 w-3.5" />
          מומלץ לשמור הרשאות גישה רק למשתמשים פעילים.
        </p>
      </div>
    </AppLayout>
  )
}
