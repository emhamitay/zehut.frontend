import AppLayout from '../components/layout/AppLayout'

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

export default function Home() {
  return (
    <AppLayout title="הוראות המערכת">
            <div className="space-y-6 text-right">
                <section className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(135deg,rgba(224,242,254,0.65),rgba(240,249,255,0.95))] p-5 sm:p-6">
                    <p className="text-sm font-semibold tracking-wide text-sky-700">ברוכים הבאים למערכת</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">תהליך עבודה מסודר, מדויק ונוח</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
                        רכזנו כאן את עקרונות העבודה החשובים כדי לשמור על נתונים נקיים, חלוקה ברורה של אחריות,
                        ויעילות גבוהה בהפקת דפי קשר.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    {workflowSteps.map((step, index) => (
                        <article
                            key={step.title}
                            className="group rounded-xl border border-border/70 bg-background/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="mb-3 flex items-center gap-3">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                                    <p className="text-xs text-slate-500">{step.page}</p>
                                </div>
                            </div>
                            <p className="text-sm leading-7 text-slate-700">{step.description}</p>
                        </article>
                    ))}
                </section>

                <section className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-5">
                    <h3 className="text-base font-bold text-amber-900">כללי זיהוי כפילויות והערות</h3>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-900/90">
                        {matchingRules.map((rule) => (
                            <li key={rule} className="rounded-md bg-white/70 px-3 py-2">
                                {rule}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-5">
                    <h3 className="text-base font-bold text-emerald-900">המלצות לשיפור העבודה השוטפת</h3>
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
