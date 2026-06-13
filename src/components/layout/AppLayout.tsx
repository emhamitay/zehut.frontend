import type { ComponentType, ReactNode, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '@/components/ui/button'
import {
  ContactSheetIcon,
  HomeIcon,
  IdCardIcon,
  UploadIcon,
  UsersIcon,
} from '@/components/icons'

type MenuItem = {
  label: string
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const menuItems: MenuItem[] = [
  { label: 'הוראות שימוש במערכת', path: '/', icon: HomeIcon },
  { label: 'הוספת אזרחים', path: '/add-citizens', icon: UploadIcon },
  { label: 'עדכון אזרחים', path: '/citizens', icon: IdCardIcon },
  { label: 'דפי קשר', path: '/contact-sheets', icon: ContactSheetIcon },
  { label: 'משתמשים', path: '/users', icon: UsersIcon },
]

type AppLayoutProps = {
  title: string
  children: ReactNode
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  return (
    <div
      className="relative min-h-screen bg-[radial-gradient(circle_at_10%_0%,#e0f2fe_0%,#f6fbff_38%,#f8fafc_70%),linear-gradient(120deg,rgba(14,116,144,0.08)_0%,rgba(2,132,199,0.02)_45%,rgba(248,250,252,0)_75%)] px-4 py-6 text-right sm:px-8 sm:py-8"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(to_bottom,rgba(125,211,252,0.25),rgba(224,242,254,0))]" />
      <div className="relative grid w-full gap-6 lg:grid-cols-[290px_1fr]">
        <Card className="border-sky-100/80 bg-card/85 shadow-[0_16px_40px_-24px_rgba(2,132,199,0.55)] backdrop-blur print:hidden">
          <CardHeader className="pb-3">
            <CardDescription className="font-medium text-slate-500">בס"ד עמ"ה עש"ו</CardDescription>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-sky-900">זהות יהודית</CardTitle>
            <p className="text-xs text-slate-500">ניהול אזרחים ודפי קשר במקום אחד</p>
          </CardHeader>

          <CardContent>
            <Separator className="mb-3" />
            <nav className="space-y-0">
              <div className="flex w-full flex-col items-end gap-2 text-sm">
                {menuItems.map((item) => (
                  <div key={item.path} className="w-full">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        clsx(
                          'group flex w-full flex-row-reverse items-center justify-between gap-2 rounded-lg border px-3 py-2 text-right text-slate-700 transition-all duration-200',
                          isActive
                            ? 'border-sky-300 bg-sky-50 text-sky-800 shadow-sm'
                            : 'border-transparent hover:border-sky-200 hover:bg-sky-50/70 hover:text-sky-700',
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 text-sky-600/90 transition group-hover:scale-105" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </div>
                ))}
              </div>
            </nav>
            {user && (
              <div className="mt-6 space-y-3 rounded-lg border border-sky-100 bg-sky-50/60 p-3 text-sm">
                <div className="text-slate-600">
                  מחובר/ת כ־<span className="font-semibold text-slate-800">{user.username}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="w-full border-sky-200 bg-white/80 hover:bg-sky-100"
                >
                  התנתק
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-sky-100/80 bg-card/90 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
          <CardHeader className="print:hidden">
            <CardTitle className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</CardTitle>
            <CardDescription className="text-slate-500">מערכת ניהול פנימית לשמירה על מידע איכותי ותהליך עבודה אחיד</CardDescription>
          </CardHeader>
          <CardContent>
            <section className="min-h-80 rounded-xl border border-dashed border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.7),rgba(248,250,252,0.9))] p-4 sm:p-6">
              {children}
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
