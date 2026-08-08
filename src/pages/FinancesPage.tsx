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
import { Plus, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyExpense: Omit<import("@/types").Expense, "id"> = {
  description: "",
  amount: 0,
  category: "תפעול",
  date: new Date().toISOString().slice(0, 10),
  payer: "partner1",
};

export default function FinancesPage() {
  const { monthlyRevenues, setMonthlyRevenue, partnerSplit } = useFinances();
  const { expenses, addExpense, removeExpense } = useExpenses();
  const [viewMode, setViewMode] = useState<"all" | "month">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyExpense);
  const [revenueInput, setRevenueInput] = useState("");

  const totals = useMemo(() => {
    const totalRevenue = monthlyRevenues.reduce((s, r) => s + r.revenue, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const gabbaiReserve = totalRevenue / 3;
    const partnerIncome = totalRevenue - gabbaiReserve;
    const netProfit = partnerIncome - totalExpenses;
    const paidByPartner1 = expenses.filter((e) => e.payer === "partner1").reduce((s, e) => s + e.amount, 0);
    const paidByPartner2 = expenses.filter((e) => e.payer === "partner2").reduce((s, e) => s + e.amount, 0);
    const payout1 = netProfit / 2 + (paidByPartner1 - totalExpenses / 2);
    const payout2 = netProfit / 2 + (paidByPartner2 - totalExpenses / 2);
    return { totalRevenue, totalExpenses, gabbaiReserve, partnerIncome, netProfit, payout1, payout2 };
  }, [monthlyRevenues, expenses]);

  function addRevenue() {
    const val = Number(revenueInput);
    if (!val) return;
    const now = new Date();
    setMonthlyRevenue(now.getMonth() + 1, now.getFullYear(), val);
    toast.success("הכנסה חודשית עודכנה");
    setRevenueInput("");
  }

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

  return (
    <Layout title="כספים" subtitle="הכנסות, הוצאות וחלוקת רווחים בין שותפים">
      <div className="mb-4 flex items-center justify-end">
        <Select value={viewMode} onValueChange={(v: "all" | "month") => setViewMode(v)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הזמן</SelectItem>
            <SelectItem value="month">חודשים נבחרים בשנה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">הזנת הכנסה חודשית כוללת</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input type="number" placeholder='סכום בש"ח' value={revenueInput} onChange={(e) => setRevenueInput(e.target.value)} />
            <Button variant="brand" onClick={addRevenue}>עדכון</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">סה"כ הכנסות</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-extrabold text-primary">{formatCurrency(totals.totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">רווח נקי</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-extrabold ${totals.netProfit >= 0 ? "text-accent" : "text-destructive"}`}>
              {formatCurrency(totals.netProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">נוסחת חלוקת רווחים</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-secondary/60 p-3"><p className="text-muted-foreground mb-1">רזרבת גבאים (1/3)</p><p className="font-bold">{formatCurrency(totals.gabbaiReserve)}</p></div>
            <div className="rounded-lg bg-secondary/60 p-3"><p className="text-muted-foreground mb-1">הכנסה לשותפים</p><p className="font-bold">{formatCurrency(totals.partnerIncome)}</p></div>
            <div className="rounded-lg bg-secondary/60 p-3"><p className="text-muted-foreground mb-1">{partnerSplit.partner1_name}</p><p className="font-bold text-primary">{formatCurrency(totals.payout1)}</p></div>
            <div className="rounded-lg bg-secondary/60 p-3"><p className="text-muted-foreground mb-1">{partnerSplit.partner2_name}</p><p className="font-bold text-primary">{formatCurrency(totals.payout2)}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">הוצאות</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("ייבוא Excel של הוצאות ייפתח כאן")}><Upload className="h-3.5 w-3.5" /> ייבוא</Button>
          <Button variant="brand" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> הוצאה חדשה</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>תיאור</TableHead>
            <TableHead>קטגוריה</TableHead>
            <TableHead>תאריך</TableHead>
            <TableHead>שולם ע"י</TableHead>
            <TableHead>סכום</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{e.description}</TableCell>
              <TableCell>{e.category}</TableCell>
              <TableCell>{formatDate(e.date)}</TableCell>
              <TableCell>{e.payer === "partner1" ? partnerSplit.partner1_name : partnerSplit.partner2_name}</TableCell>
              <TableCell className="font-medium">{formatCurrency(e.amount)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeExpense(e.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
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
    </Layout>
  );
}
