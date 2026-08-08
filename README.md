# טעינה בקליק -- Rav-Kav Online Management (פרונט)

פרויקט React 18 + TypeScript 5 + Vite 5 + Tailwind CSS v3, בנוי לפי האפיון המלא
(עיצוב ומיתוג כלולים: גרדיאנט מותג כחול → תכלת → ירוק, RTL, פונט Inter).

**זהו פרונט-אנד עצמאי עם נתונים מדומים (mock data) בזיכרון** -- אין חיבור אמיתי
ל-Supabase כרגע. כל הדפים, הקומפוננטות והלוגיקה העסקית (כולל נוסחת חלוקת
הרווחים) בנויים ועובדים על נתוני דמו, כך שאפשר לראות ולהתנסות במערכת המלאה.

## הרצה מקומית

```bash
npm install
npm run dev
```

ואז פתחו את הכתובת שתודפס (בד"כ http://localhost:5173).

## בנייה לפרודקשן

```bash
npm run build
npm run preview
```

## מבנה עיקרי

```
src/
  App.tsx                 ניתוב (react-router-dom v6)
  index.css                טוקני עיצוב (HSL) + גרדיאנט המותג
  components/
    ui/                     רכיבי בסיס בסגנון shadcn/ui (Radix + Tailwind)
    Layout.tsx, AppSidebar.tsx, HelpButton.tsx, GlobalMissingDataBell.tsx
    CircularProgressGauge.tsx   מד התקדמות מעגלי עם גרדיאנט + קונפטי
  pages/
    Index, DevicesPage, FinancesPage, DataFilterPage,
    InstallationsTrackerPage, GabbaiPortalPage, AuthPage,
    ResetPasswordPage, PartnerFeedbackPage, UnsubscribePage
  store/
    useStore.tsx            React Context עם CRUD מדומה (מחליף את Supabase כרגע)
    mockData.ts              נתוני דמו
  types/index.ts             טיפוסים לפי מודל הנתונים באפיון
```

## חיבור ל-Supabase אמיתי (השלב הבא)

הפרויקט נבנה כך שקל להחליף את `src/store/useStore.tsx`: כרגע כל הפעולות
(add/update/remove) עובדות מול state מקומי. כדי לחבר Supabase אמיתי:

1. `npm install @supabase/supabase-js`
2. ליצור `src/lib/supabaseClient.ts` עם ה-URL וה-anon key.
3. להחליף את הפונקציות ב-`useStore.tsx` בקריאות `supabase.from(...)`, ולהוסיף
   `@tanstack/react-query` לניהול קאשינג (כפי שמצוין באפיון).
4. ליצור את טבלאות ה-DB, מדיניות ה-RLS, ופונקציית `has_role()` בהתאם לפרק
   "מודל נתונים" ו"אבטחה" באפיון המקורי.
5. Edge Functions (`link-gabbai`, `process-email-queue` וכו') הן פרויקט Deno
   נפרד תחת `supabase/functions/` -- לא כלולות כאן וטרם נכתבו.

## הערות

- העלאת תמונות, גאוקודינג (Google Maps), ייבוא Excel, ותזכורות טלפוניות
  (ימות המשיח) מיוצגים כרגע כפעולות מדומות (toast) -- הכנת האינטגרציות
  האמיתיות דורשת מפתחות API אמיתיים שאינם זמינים בסביבת הפיתוח הזו.
- מסך "כניסה" (`/auth`, `/gabbai-login`) אינו אוכף הרשאות אמיתיות בשלב זה.
