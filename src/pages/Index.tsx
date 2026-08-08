import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDevices, useFinances } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { Smartphone, TrendingUp, TrendingDown, PiggyBank, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Index() {
  const { devices } = useDevices();
  const { monthlyRevenues, expenses } = useFinances();

  const stats = useMemo(() => {
    const activeDevices = devices.filter((d) => d.status === "active").length;
    const totalRevenue = monthlyRevenues.reduce((s, r) => s + r.revenue, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    return { totalDevices: devices.length, activeDevices, totalRevenue, totalExpenses, netProfit };
  }, [devices, monthlyRevenues, expenses]);

  const cards = [
    { label: "סה\"כ מכשירים", value: `${stats.totalDevices}`, sub: `${stats.activeDevices} פעילים`, icon: Smartphone, tone: "primary" },
    { label: "סה\"כ הכנסות", value: formatCurrency(stats.totalRevenue), sub: "3 חודשים אחרונים", icon: TrendingUp, tone: "accent" },
    { label: "סה\"כ הוצאות", value: formatCurrency(stats.totalExpenses), sub: "כולל ציוד ותפעול", icon: TrendingDown, tone: "amber" },
    {
      label: "רווח נקי",
      value: formatCurrency(stats.netProfit),
      sub: stats.netProfit >= 0 ? "מצב חיובי" : "מצב שלילי",
      icon: PiggyBank,
      tone: stats.netProfit >= 0 ? "accent" : "destructive",
    },
  ];

  return (
    <Layout title="דשבורד" subtitle="סקירה כללית של המערכת">
      <div className="mb-6 overflow-hidden rounded-xl bg-gradient-brand p-8 text-white shadow-elevated">
        <p className="text-sm font-medium text-white/80 mb-1">ערך צבור · טעינה בקליק</p>
        <h2 className="text-3xl font-extrabold mb-2">ניהול רב-קו</h2>
        <p className="max-w-xl text-white/85 text-sm">
          תמונת מצב חיה על כל מכשירי הטעינה, מחזור הלידים וההתקנות, וחלוקת הרווחים בין השותפים -- הכל במקום אחד.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                  <p
                    className={`text-2xl font-extrabold ${
                      c.tone === "destructive" ? "text-destructive" : c.tone === "amber" ? "text-amber" : c.tone === "accent" ? "text-accent" : "text-primary"
                    }`}
                  >
                    {c.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{c.sub}</p>
                </div>
                <div className="rounded-lg bg-gradient-brand-soft p-2">
                  <c.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm mb-1">רשימת מכשירים</p>
              <p className="text-xs text-muted-foreground">צפייה, עריכה והוספת מכשירים חדשים</p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link to="/devices">
                מעבר <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm mb-1">כספים</p>
              <p className="text-xs text-muted-foreground">הכנסות, הוצאות וחלוקת רווחים בין שותפים</p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link to="/finances">
                מעבר <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button variant="outline" size="sm" onClick={() => toast.success("מייל בדיקה נשלח בהצלחה")}>
          <Mail className="h-3.5 w-3.5" />
          שליחת מייל בדיקה
        </Button>
      </div>
    </Layout>
  );
}
