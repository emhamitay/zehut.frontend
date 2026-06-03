import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Setup() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc_0%,#f0f9ff_45%,#f8fafc_100%)] px-4"
      dir="rtl"
    >
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">נדרשת הגדרה ראשונית</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>אין עדיין משתמשים במערכת.</p>
          <p>
            כדי ליצור את המשתמש הראשון, הגדירו את המשתנים הבאים בקובץ ה־
            <code className="font-mono">.env</code> של השרת והפעילו אותו מחדש:
          </p>
          <pre className="rounded-md bg-slate-100 p-3 text-left font-mono text-xs" dir="ltr">
{`BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_PASSWORD=choose-a-strong-password`}
          </pre>
          <p>לאחר ההפעלה מחדש, רעננו את הדף ותוכלו להתחבר.</p>
        </CardContent>
      </Card>
    </div>
  )
}
