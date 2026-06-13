import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '@/components/ui/button'
import { SparkIcon, UsersIcon } from '@/components/icons'
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
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f0f9ff_45%,#f8fafc_100%)] px-4 py-8"
      dir="rtl"
    >
      <Card className="glass-surface animate-rise-in w-full max-w-md shadow-[0_20px_45px_-30px_rgba(2,132,199,0.75)]">
        <CardHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <UsersIcon className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-slate-900">הגדרה ראשונית</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-slate-600">
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
                className="w-full"
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
                className="w-full"
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
            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
              <SparkIcon className="h-3.5 w-3.5" />
              בחרו סיסמה חזקה כדי לשמור על אבטחת המערכת.
            </p>
          </form>
          <details className="rounded-lg border border-border/70 bg-white/60 p-3 text-xs text-slate-600">
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
