import type { Device, Expense, FilterEntry, Installation, MonthlyTotalRevenue, PartnerSplit } from "@/types";

export const mockDevices: Device[] = [
  {
    id: "d1", name: "בית כנסת היכל שלמה", category: "synagogue", address: "רחוב הרב קוק 12, בני ברק",
    status: "active", purchase_price: 4200, monthly_revenue: 1850, roi_enabled: true,
    gabbai_name: "ר' משה גולדברג", gabbai_phone: "052-1234567", commission_percent: 8,
    device_count: 1, created_at: "2024-11-02T08:00:00Z",
  },
  {
    id: "d2", name: "כולל אור החיים", category: "kollel", address: "רחוב עזרא 4, ירושלים",
    status: "active", purchase_price: 4200, monthly_revenue: 2420, roi_enabled: true,
    gabbai_name: "ר' יעקב שטרן", gabbai_phone: "054-2345678", commission_percent: 10,
    device_count: 2, created_at: "2024-09-15T08:00:00Z",
  },
  {
    id: "d3", name: "ישיבת נר יצחק", category: "yeshiva", address: "רחוב חזון איש 8, בני ברק",
    status: "maintenance", purchase_price: 4200, monthly_revenue: 980, roi_enabled: true,
    gabbai_name: "ר' דוד לוין", gabbai_phone: "050-3456789", commission_percent: 8,
    device_count: 1, created_at: "2025-01-20T08:00:00Z",
  },
  {
    id: "d4", name: "מכולת \"ברכת השם\"", category: "business", address: "רחוב הראשונים 21, אלעד",
    status: "active", purchase_price: 3900, monthly_revenue: 3100, roi_enabled: false,
    gabbai_name: "יוסי אברג'יל", gabbai_phone: "053-4567890", commission_percent: 6,
    device_count: 1, created_at: "2024-06-10T08:00:00Z",
  },
  {
    id: "d5", name: "מקווה רחל אמנו", category: "mikveh", address: "רחוב הזורע 15, פתח תקווה",
    status: "active", purchase_price: 4200, monthly_revenue: 1420, roi_enabled: true,
    gabbai_name: "אשת גבאי - שרה כהן", gabbai_phone: "058-5678901", commission_percent: 10,
    device_count: 1, created_at: "2025-02-05T08:00:00Z",
  },
  {
    id: "d6", name: "סמינר בית יעקב", category: "seminary", address: "רחוב רש\"י 3, ירושלים",
    status: "inactive", purchase_price: 4200, monthly_revenue: 0, roi_enabled: true,
    gabbai_name: "גב' רבקה וייס", gabbai_phone: "052-6789012", commission_percent: 8,
    device_count: 1, created_at: "2024-08-01T08:00:00Z",
  },
];

export const mockFilterEntries: FilterEntry[] = [
  {
    id: "f1", institution_name: "בית כנסת זכרון מאיר", contact_person: "אברהם פרידמן", phone: "050-9871234",
    location: "רמת גן", traffic: "כ-150 איש בשבת", status: "חדש", source: "המלצה", notes: "מעוניינים מאוד, יש כבר מכונת שתייה",
    lead_rating: 8, is_private: false, created_at: "2026-07-20T08:00:00Z",
  },
  {
    id: "f2", institution_name: "כולל משנת רבי", contact_person: "חיים רוזנברג", phone: "054-1122334",
    location: "בני ברק", traffic: "80 אברכים", status: "בבדיקה", source: "פייסבוק", notes: "",
    lead_rating: 6, is_private: true, created_at: "2026-07-22T08:00:00Z",
  },
  {
    id: "f3", institution_name: "ישיבת תפארת ירושלים", contact_person: "שלמה גרוס", phone: "052-2233445",
    location: "ירושלים", traffic: "כ-300 בחורים", status: "חדש", source: "אתר", notes: "צריך לתאם עם הגבאי הראשי",
    lead_rating: 9, is_private: false, created_at: "2026-07-25T08:00:00Z",
  },
  {
    id: "f4", institution_name: "מקווה נשים - שכונת רמות", contact_person: "מרים אדלר", phone: "058-3344556",
    location: "ירושלים", traffic: "לא ידוע", status: "לא רלוונטי", source: "טלפוני", notes: "אין תקציב כרגע",
    lead_rating: 2, is_private: false, created_at: "2026-06-30T08:00:00Z",
  },
];

export const mockInstallations: Installation[] = [
  {
    id: "i1", institution_name: "בית כנסת אהבת שלום", phone: "050-1112223", contact_person: "נתן ברק",
    address: "רחוב סוקולוב 9, בני ברק", institution_type: "synagogue", notes: "מחכים לאישור ועד",
    status: "בתהליך", source_type: "filter", is_private: false,
    milestone_contact: true, milestone_agreement: true, milestone_survey: false, milestone_installed: false,
    monthly_goal: 5, scheduled_at: undefined, created_at: "2026-07-10T08:00:00Z", has_active_reminder: true,
  },
  {
    id: "i2", institution_name: "כולל דברי חיים", phone: "054-2223334", contact_person: "יונתן שפירא",
    address: "רחוב עזרא 11, ביתר עילית", institution_type: "kollel", notes: "",
    status: "בתהליך", source_type: "direct", is_private: false,
    milestone_contact: true, milestone_agreement: false, milestone_survey: false, milestone_installed: false,
    monthly_goal: 5, created_at: "2026-07-18T08:00:00Z",
  },
  {
    id: "i3", institution_name: "ישיבת עטרת שלמה", phone: "052-3334445", contact_person: "אליהו וולף",
    address: "רחוב חנקין 5, אלעד", institution_type: "yeshiva", notes: "נקבע תאריך התקנה",
    status: "מוכן להתקנה", source_type: "filter", is_private: false,
    milestone_contact: true, milestone_agreement: true, milestone_survey: true, milestone_installed: false,
    monthly_goal: 5, scheduled_at: "2026-08-10T10:00:00Z", created_at: "2026-06-28T08:00:00Z", has_active_reminder: true,
  },
  {
    id: "i4", institution_name: "בית עסק - פיצוציה מרכזית", phone: "053-4445556", contact_person: "אבי מזרחי",
    address: "רחוב ז'בוטינסקי 40, פתח תקווה", institution_type: "business", notes: "פרטי - קשר אישי",
    status: "בתהליך", source_type: "direct", is_private: true,
    milestone_contact: true, milestone_agreement: true, milestone_survey: true, milestone_installed: true,
    monthly_goal: 5, closed_at: "2026-07-30T08:00:00Z", created_at: "2026-06-01T08:00:00Z",
  },
  {
    id: "i5", institution_name: "סמינר אורות חנה", phone: "058-5556667", contact_person: "אסתר בן דוד",
    address: "רחוב הנביאים 22, ירושלים", institution_type: "seminary", notes: "ממתינים לפגישה ראשונה",
    status: "חדש", source_type: "filter", is_private: false,
    milestone_contact: false, milestone_agreement: false, milestone_survey: false, milestone_installed: false,
    monthly_goal: 5, created_at: "2026-07-29T08:00:00Z",
  },
];

export const mockExpenses: Expense[] = [
  { id: "e1", description: "רכישת 3 מכשירים חדשים", amount: 12600, category: "ציוד", date: "2026-07-05", payer: "partner1" },
  { id: "e2", description: "תחזוקה ותיקונים", amount: 850, category: "תחזוקה", date: "2026-07-12", payer: "partner2" },
  { id: "e3", description: "נסיעות והתקנות", amount: 620, category: "תפעול", date: "2026-07-18", payer: "partner1" },
  { id: "e4", description: "עמלות סליקה", amount: 1340, category: "סליקה", date: "2026-07-25", payer: "partner2" },
];

export const mockMonthlyRevenues: MonthlyTotalRevenue[] = [
  { id: "r1", month: 7, year: 2026, revenue: 48500 },
  { id: "r2", month: 6, year: 2026, revenue: 44200 },
  { id: "r3", month: 5, year: 2026, revenue: 41800 },
];

export const mockPartnerSplit: PartnerSplit = {
  partner1_name: "שותף א׳ - יעקב",
  partner2_name: "שותף ב׳ - מנחם",
  partner1_percent: 50,
  partner2_percent: 50,
};
