import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Setup() {
  const { loading, setupRequired, setupFirstUser } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        טוען...
      </div>
    )
  }
  if (!setupRequired) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await setupFirstUser(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      const raw = (err as Error).message
      setError(
        raw === 'setup_already_completed'
          ? 'כבר קיים משתמש במערכת. רעננו את הדף.'
          : raw,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc_0%,#f0f9ff_45%,#f8fafc_100%)] px-4 py-8"
      dir="rtl"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">הגדרה ראשונית</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-slate-600">
            עדיין אין משתמשים במערכת. צרו את המשתמש הראשון:
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="username" className="text-sm font-medium">
                שם משתמש
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                סיסמה
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-xs text-slate-500">לפחות 8 תווים.</p>
            </div>
            {error && (
              <div role="alert" className="text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'יוצר...' : 'צור משתמש'}
            </Button>
          </form>
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">
              העדפתם להגדיר משתמש דרך הסביבה?
            </summary>
            <div className="mt-2 space-y-2">
              <p>
                אפשר להגדיר את המשתמש הראשון בקובץ <code>.env</code> של השרת
                ולהפעיל אותו מחדש:
              </p>
              <pre
                className="rounded-md bg-slate-100 p-2 font-mono"
                dir="ltr"
              >
{`BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_PASSWORD=choose-a-strong-password`}
              </pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
