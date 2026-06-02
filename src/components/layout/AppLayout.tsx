import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type MenuItem = {
  label: string
  path: string
}

const menuItems: MenuItem[] = [
  { label: 'הוסף אנשים', path: '/add-people' },
  { label: 'קבל אנשים', path: '/get-people' },
  { label: 'משתמשים', path: '/users' },
]

type AppLayoutProps = {
  title: string
  children: ReactNode
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#f0f9ff_45%,#f8fafc_100%)] px-4 py-8 sm:px-8"
      dir="rtl"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="bg-card/90 shadow-md backdrop-blur">
          <CardHeader>
            <CardDescription>תפריט</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight">זהות</CardTitle>
          </CardHeader>

          <CardContent>
            <Separator className="mb-4" />
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavLink key={item.path} to={item.path}>
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      className="w-full justify-start text-base"
                    >
                      {item.label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Card className="bg-card/90 shadow-md backdrop-blur">
          <CardHeader>
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
