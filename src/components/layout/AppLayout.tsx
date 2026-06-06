import type { ReactNode } from 'react'
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

type MenuItem = {
  label: string
  path: string
}

const menuItems: MenuItem[] = [
  { label: 'הוספת אזרחים', path: '/add-citizens' },
  { label: 'עדכון אזרחים', path: '/citizens' },
  { label: 'דפי קשר', path: '/contact-sheets' },
  { label: 'משתמשים', path: '/users' },
]

type AppLayoutProps = {
  title: string
  children: ReactNode
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#f0f9ff_45%,#f8fafc_100%)] px-4 py-8 text-right sm:px-8"
      dir="rtl"
    >
      <div className="grid w-full gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="bg-card/90 shadow-md backdrop-blur print:hidden">
          <CardHeader>
            <CardDescription>בס"ד עמ"ה עש"ו</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-sky-200">זהות יהודית</CardTitle>
          </CardHeader>

          <CardContent>
            <Separator className='mb-1'/>
            <nav className="space-y-0">
              <div className="flex flex-col items-right gap-2 text-sm">
                <div className="border-b border-border/70 mt-1" />
                {menuItems.map((item) => (
                  <div key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        clsx(
                          'hover:text-blue-400 text-sky-800 transition-colors duration-200',
                          isActive && 'text-sky-500 font-bold'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                    <div className="border-b border-border/70 mt-1" />
                  </div>
                ))}
              </div>
            </nav>
            {user && (
              <div className="mt-6 space-y-2 border-t border-border/70 pt-4 text-sm">
                <div className="text-slate-600">
                  מחובר/ת כ־<span className="font-medium">{user.username}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="w-full"
                >
                  התנתק
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/90 shadow-md backdrop-blur">
          <CardHeader className="print:hidden">
            <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <section className="min-h-[320px] rounded-lg border border-dashed border-border/70 bg-muted/30 p-6">
              {children}
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
