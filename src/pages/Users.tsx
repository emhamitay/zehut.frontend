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
        <form
          onSubmit={onCreate}
          className="grid gap-3 rounded-lg border border-border/70 bg-card/50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-1">
            <label htmlFor="new-username" className="text-sm font-medium">
              שם משתמש
            </label>
            <input
              id="new-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-sm font-medium">
              סיסמה
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'מוסיף...' : 'הוסף משתמש'}
          </Button>
        </form>

        {error && (
          <div role="alert" className="text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">טוען...</p>
        ) : (
          <ul
            data-testid="users-list"
            className="divide-y divide-border/70 rounded-lg border border-border/70 bg-card/50"
          >
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span className="font-medium">{u.username}</span>
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
      </div>
    </AppLayout>
  )
}
