import AppLayout from '../components/layout/AppLayout'
import { Link } from 'react-router-dom'
import {
    ContactSheetIcon,
    IdCardIcon,
    SearchIcon,
    SparkIcon,
    UploadIcon,
    UsersIcon,
    WarningIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'

const workflowSteps = [
    {
        title: 'ניהול משתמשים',
        page: 'דף משתמשים',
        description:
            'לכל איש צוות מומלץ לפתוח משתמש אישי. כך אפשר לשייך דפי קשר בצורה מסודרת, לעקוב אחרי אחריות, ולחזור בקלות לדפים שכבר הונפקו.',
    },
    {
        title: 'קליטת אזרחים',
        page: 'דף הוספת אזרחים',
        description:
            'מעלים קובץ Excel או Word עם רשימות האזרחים. המערכת מונעת קליטה כפולה של רשומות קיימות, ומסמנת מקרים שדורשים בירור.',
    },
    {
        title: 'הפקת דפי קשר',
        page: 'דף דפי קשר',
        description:
            'המתקשרים מפיקים רשימות של אזרחים שעדיין לא שויכו לאחרים. אם מופיעה הערה, מבצעים בירור קצר ומעדכנים את הפרטים כדי לשמור על מאגר מדויק.',
    },
    {
        title: 'מעקב ואחריות',
        page: 'לאורך כל המערכת',
        description:
            'מומלץ שכל משתמש יפיק לעצמו את דפי הקשר שלו. כך מתקבלת תמונת מצב ברורה: מי מטפל בכל אזרח, ומה כבר בוצע.',
    },
] as const

const matchingRules = [
    'תעודת זהות זהה עם שם שונה: תופיע הערה לבירור.',
    'טלפון זהה עם תעודת זהות שונה: תופיע הערה לבירור.',
    'שם זהה וטלפונים שונים, ללא תעודת זהות או כשרק לאחד יש תעודת זהות: יוצגו כשני אנשים נפרדים.',
    'שם זהה ותעודת זהות זהה עם כמה טלפונים: תיווצר רשומה אחת עם כל מספרי הטלפון.',
] as const

const recommendations = [
    'בצעו אימות קצר להערות כבר בזמן העבודה, ולא לדחות לסוף יום.',
    'לפני העלאת קובץ חדש, מומלץ לוודא שאין בו שורות לא רלוונטיות או כפילויות פנימיות.',
    'הקפידו לעדכן תיקונים בדף עדכון אזרחים כדי לשפר את איכות הנתונים לשנים הבאות.',
] as const

const quickActions = [
    { label: 'הוספת אזרחים', to: '/add-citizens', icon: UploadIcon },
    { label: 'עדכון אזרחים', to: '/citizens', icon: SearchIcon },
    { label: 'דפי קשר', to: '/contact-sheets', icon: ContactSheetIcon },
    { label: 'משתמשים', to: '/users', icon: UsersIcon },
] as const

const stepIcons = [UsersIcon, UploadIcon, ContactSheetIcon, IdCardIcon] as const

export default function Home() {
  return (
    <AppLayout title="הוראות המערכת">
            <div className="space-y-6 text-right">
                <section className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(135deg,rgba(224,242,254,0.78),rgba(240,249,255,0.96))] p-5 sm:p-6">
                    <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-3 py-1 text-xs font-semibold tracking-wide text-sky-800">
                        <SparkIcon className="h-4 w-4" />
                        ברוכים הבאים למערכת
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">תהליך עבודה מסודר, מדויק ונוח</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
                        רכזנו כאן את עקרונות העבודה החשובים כדי לשמור על נתונים נקיים, חלוקה ברורה של אחריות,
                        ויעילות גבוהה בהפקת דפי קשר.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {quickActions.map((action) => (
                            <Button key={action.to} asChild variant="outline" className="border-sky-200 bg-white/80 hover:bg-sky-100">
                                <Link to={action.to} className="inline-flex items-center gap-2">
                                    <action.icon className="h-4 w-4" />
                                    {action.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    {workflowSteps.map((step, index) => {
                        const Icon = stepIcons[index]
                        return (
                        <article
                            key={step.title}
                            className="group rounded-xl border border-border/70 bg-background/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                        >
                            <div className="mb-3 flex items-center gap-3">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                                    {index + 1}
                                </span>
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                                    <p className="text-xs text-slate-500">{step.page}</p>
                                </div>
                            </div>
                            <p className="text-sm leading-7 text-slate-700">{step.description}</p>
                        </article>
                        )
                    })}
                </section>

                <section className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-5">
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-amber-900">
                        <WarningIcon className="h-4 w-4" />
                        כללי זיהוי כפילויות והערות
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-900/90">
                        {matchingRules.map((rule) => (
                            <li key={rule} className="rounded-md bg-white/70 px-3 py-2">
                                {rule}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-5">
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-emerald-900">
                        <SparkIcon className="h-4 w-4" />
                        המלצות לשיפור העבודה השוטפת
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-emerald-900/90">
                        {recommendations.map((tip) => (
                            <li key={tip} className="rounded-md bg-white/70 px-3 py-2">
                                {tip}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
    </AppLayout>
  )
}
