import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '@/components/ui/button'
import { SparkIcon, UsersIcon } from '@/components/icons'
import PasswordField from '@/components/PasswordField'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Login() {
  const { user, setupRequired, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (setupRequired) return <Navigate to="/setup" replace />
  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      const raw = (err as Error).message
      setError(raw === 'invalid_credentials' ? 'שם משתמש או סיסמה שגויים' : raw)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f0f9ff_45%,#f8fafc_100%)] px-4"
      dir="rtl"
    >
      <Card className="glass-surface animate-rise-in w-full max-w-sm shadow-[0_20px_45px_-30px_rgba(2,132,199,0.75)]">
        <CardHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <UsersIcon className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-slate-900">התחברות</CardTitle>
          <p className="text-sm text-slate-600">התחברו למערכת כדי להמשיך לעבודה השוטפת</p>
        </CardHeader>
        <CardContent>
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
              <PasswordField
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <div role="alert" className="text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'מתחבר...' : 'התחבר'}
            </Button>
            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
              <SparkIcon className="h-3.5 w-3.5" />
              שמירה על סדר ועדכון שוטף משפרים את איכות הנתונים לאורך זמן.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
