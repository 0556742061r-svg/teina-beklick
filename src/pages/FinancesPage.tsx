import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useFinances, useExpenses } from "@/store/useStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Upload, Trash2, Pencil, Scale } from "lucide-react";
import { toast } from "sonner";
import { VoiceExpenseRecorder } from "@/components/VoiceExpenseRecorder";
import { PendingVoiceNotes } from "@/components/PendingVoiceNotes";

const emptyExpense: Omit<import("@/types").Expense, "id"> = {
  description: "",
  amount: 0,
  category: "תפעול",
  date: new Date().toISOString().slice(0, 10),
  payer: "partner1",
};

type PeriodMode = "all" | "month";

export default function FinancesPage() {
  const { monthlyRevenues, partnerSplit } = useFinances();
  const { expenses, addExpense, removeExpense } = useExpenses();
  const [periodMode, setPeriodMode] = useState<PeriodMode>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyExpense);

  const availableMonths = useMemo(() => {
    const set = new Set(expenses.map((e) => e.date.slice(0, 7)));
    return Array.from(set).sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (periodMode === "month" && selectedMonth) {
      return expenses.filter((e) => e.date.slice(0, 7) === selectedMonth);
    }
    return expenses;
  }, [expenses, periodMode, selectedMonth]);

  const totals = useMemo(() => {
    const totalRevenue = periodMode === "all" ? monthlyRevenues.reduce((s, r) => s + r.revenue, 0) : 0;
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const gabbaiThird = totalRevenue / 3;
    const profitToDistribute = totalRevenue - gabbaiThird - totalExpenses;
    const paidByPartner1 = filteredExpenses.filter((e) => e.payer === "partner1").reduce((s, e) => s + e.amount, 0);
    const paidByPartner2 = filteredExpenses.filter((e) => e.payer === "partner2").reduce((s, e) => s + e.amount, 0);
    const diff = Math.round(Math.abs(paidByPartner1 - paidByPartner2) / 2);
    const owingPartner = paidByPartner1 < paidByPartner2 ? "partner1" : "partner2";
    return { totalRevenue, totalExpenses, gabbaiThird, profitToDistribute, paidByPartner1, paidByPartner2, diff, owingPartner };
  }, [monthlyRevenues, filteredExpenses, periodMode]);

  function saveExpense() {
    if (!form.description || !form.amount) {
      toast.error("יש למלא תיאור וסכום");
      return;
    }
    addExpense(form);
    toast.success("הוצאה נוספה");
    setForm(emptyExpense);
    setDialogOpen(false);
  }

  const owingName = totals.owingPartner === "partner1" ? partnerSplit.partner1_name : partnerSplit.partner2_name;
  const owedName = totals.owingPartner === "partner1" ? partnerSplit.partner2_name : partnerSplit.partner1_name;

  return (
    <Layout title="כספים" subtitle="הכנסות, הוצאות וחלוקת רווחים בין שותפים">
      <div className="mb-4 flex items-center justify-end gap-2">
        <Select value={periodMode} onValueChange={(v: PeriodMode) => { setPeriodMode(v); if (v === "all") setSelectedMonth(""); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="תקופה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל התקופות</SelectItem>
            <SelectItem value="month">חודשי</SelectItem>
          </SelectContent>
        </Select>
        {periodMode === "month" && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36"><SelectValue placeholder="בחר חודש" /></SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">רווח לחלוקה</p>
            <p className={`text-2xl font-extrabold ${totals.profitToDistribute >= 0 ? "text-accent" : "text-destructive"}`}>
              {formatCurrency(totals.profitToDistribute)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">הוצאות</p>
            <p className="text-2xl font-extrabold text-amber-500">{formatCurrency(totals.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">שליש לגבאים</p>
            <p className="text-2xl font-extrabold text-violet-500">{formatCurrency(totals.gabbaiThird)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">הכנסות ({periodMode === "all" ? "כל התקופות" : "החודש שנבחר"})</p>
            <p className="text-2xl font-extrabold text-primary">{formatCurrency(totals.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">חלוקת שותפים</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground">שם שותף א׳</Label>
              <div className="mt-1 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm font-medium">{partnerSplit.partner1_name}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">שם שותף ב׳</Label>
              <div className="mt-1 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm font-medium">{partnerSplit.partner2_name}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground mb-1">שילם {partnerSplit.partner1_name}</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(totals.paidByPartner1)}</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground mb-1">שילם {partnerSplit.partner2_name}</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(totals.paidByPartner2)}</p>
            </div>
          </div>

          <div className="rounded-lg bg-gradient-brand-soft border border-primary/20 p-4 text-center">
            {totals.profitToDistribute >= 0 ? (
              <p className="text-sm font-medium">יש רווח לחלוקה של {formatCurrency(totals.profitToDistribute)} בין השותפים בשווה.</p>
            ) : totals.diff === 0 ? (
              <p className="text-sm text-muted-foreground">אין רווח לחלוקה כרגע -- ההוצאות מאוזנות בין השותפים.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" strokeWidth={1.5} /> אין רווח לחלוקה כרגע -- איזון הוצאות בלבד:
                </p>
                <p className="text-base font-bold text-primary">
                  {owingName} חייב לשלם ל{owedName} {formatCurrency(totals.diff)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  ({partnerSplit.partner1_name} שילם {formatCurrency(totals.paidByPartner1)} | {partnerSplit.partner2_name} שילם {formatCurrency(totals.paidByPartner2)})
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <PendingVoiceNotes partnerSplit={partnerSplit} />

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">הוצאות -- {periodMode === "all" ? "כל התקופות" : selectedMonth || "בחר חודש"}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("ייבוא Excel של הוצאות ייפתח כאן")}><Upload className="h-3.5 w-3.5" /> ייבוא אקסל</Button>
          <Button variant="brand" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> הוסף הוצאה</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>תיאור</TableHead>
            <TableHead>סכום</TableHead>
            <TableHead>קטגוריה</TableHead>
            <TableHead>שילם</TableHead>
            <TableHead>תאריך</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{e.description}</TableCell>
              <TableCell className="font-medium">{formatCurrency(e.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{e.category}</TableCell>
              <TableCell>{e.payer === "partner1" ? partnerSplit.partner1_name : partnerSplit.partner2_name}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toast.info("עריכת הוצאה תיפתח כאן")}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeExpense(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filteredExpenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">אין הוצאות בתקופה שנבחרה.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>הוצאה חדשה</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>תיאור</Label><Input className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>סכום</Label><Input type="number" className="mt-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>קטגוריה</Label><Input className="mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>תאריך</Label><Input type="date" dir="ltr" className="mt-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div>
                <Label>מי שילם</Label>
                <Select value={form.payer} onValueChange={(v: "partner1" | "partner2") => setForm({ ...form, payer: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partner1">{partnerSplit.partner1_name}</SelectItem>
                    <SelectItem value="partner2">{partnerSplit.partner2_name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="brand" onClick={saveExpense}>הוספה</Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VoiceExpenseRecorder />
    </Layout>
  );
}
