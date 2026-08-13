import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useFinances } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import type { GabbaiFundEntry, GabbaiFundEntryType } from "@/types";
import { PiggyBank, Plus, Trash2, ArrowDownCircle, ArrowUpCircle, HandCoins, Users, Undo2 } from "lucide-react";
import { toast } from "sonner";

const typeLabels: Record<GabbaiFundEntryType, string> = {
  received: "התקבל לקרן",
  personal_take: "לקיחה אישית (חוב מלא)",
  shared_expense_take: "לקיחה להוצאה משותפת (0 חוב)",
  paid_to_gabbai: "שולם בפועל לגבאי",
  repayment: "החזר לקרן",
};

const typeIcons: Record<GabbaiFundEntryType, typeof PiggyBank> = {
  received: ArrowDownCircle,
  personal_take: HandCoins,
  shared_expense_take: Users,
  paid_to_gabbai: ArrowUpCircle,
  repayment: Undo2,
};

const emptyForm = {
  entry_type: "received" as GabbaiFundEntryType,
  amount: "",
  partner: "partner1" as "partner1" | "partner2",
  recipient_name: "",
  note: "",
  entry_date: new Date().toISOString().slice(0, 10),
};

export default function GabbaiFundPage() {
  const { partnerSplit } = useFinances();
  const [entries, setEntries] = useState<GabbaiFundEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gabbai_fund_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error && data) setEntries(data as GabbaiFundEntry[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("gabbai_fund_entries_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "gabbai_fund_entries" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const summary = useMemo(() => {
    let received = 0, personalTake = 0, sharedTake = 0, paidToGabbai = 0, repayment = 0;
    let debtPartner1 = 0, debtPartner2 = 0;
    for (const e of entries) {
      switch (e.entry_type) {
        case "received": received += e.amount; break;
        case "personal_take":
          personalTake += e.amount;
          if (e.partner === "partner1") debtPartner1 += e.amount;
          if (e.partner === "partner2") debtPartner2 += e.amount;
          break;
        case "shared_expense_take": sharedTake += e.amount; break;
        case "paid_to_gabbai": paidToGabbai += e.amount; break;
        case "repayment":
          repayment += e.amount;
          if (e.partner === "partner1") debtPartner1 -= e.amount;
          if (e.partner === "partner2") debtPartner2 -= e.amount;
          break;
      }
    }
    const fundBalance = received - personalTake - sharedTake - paidToGabbai + repayment;
    return { received, personalTake, sharedTake, paidToGabbai, repayment, fundBalance, debtPartner1, debtPartner2 };
  }, [entries]);

  async function saveEntry() {
    const amountNum = Number(form.amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("יש להזין סכום תקין");
      return;
    }
    if (form.entry_type === "paid_to_gabbai" && !form.recipient_name.trim()) {
      toast.error("יש להזין למי שולם");
      return;
    }
    const needsPartner = form.entry_type === "personal_take" || form.entry_type === "repayment";

    const { error } = await supabase.from("gabbai_fund_entries").insert({
      entry_type: form.entry_type,
      amount: amountNum,
      partner: needsPartner ? form.partner : null,
      recipient_name: form.entry_type === "paid_to_gabbai" ? form.recipient_name.trim() : null,
      note: form.note.trim() || null,
      entry_date: form.entry_date,
    });
    if (error) {
      toast.error("שמירת הרישום נכשלה");
      return;
    }
    toast.success("נוסף בהצלחה");
    setForm(emptyForm);
    setDialogOpen(false);
  }

  async function remove(entry: GabbaiFundEntry) {
    const { error } = await supabase.from("gabbai_fund_entries").delete().eq("id", entry.id);
    if (error) {
      toast.error("מחיקה נכשלה");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  }

  const needsPartnerField = form.entry_type === "personal_take" || form.entry_type === "repayment";

  return (
    <Layout title="קרן גבאים" subtitle="מעקב אחרי כסף שהתקבל, נלקח, ושולם בפועל לגבאים">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-extrabold text-primary">{formatCurrency(summary.fundBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">יתרה בקרן (אמורה לרדת לאפס)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-extrabold text-accent">{formatCurrency(summary.received)}</p>
            <p className="text-xs text-muted-foreground mt-1">סה"כ התקבל</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-extrabold text-violet-500">{formatCurrency(summary.paidToGabbai)}</p>
            <p className="text-xs text-muted-foreground mt-1">שולם בפועל לגבאים</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-extrabold text-amber-500">{formatCurrency(summary.personalTake - summary.repayment)}</p>
            <p className="text-xs text-muted-foreground mt-1">חוב אישי כולל שטרם הוחזר</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className={summary.debtPartner1 > 0 ? "border-destructive/40 bg-destructive/5" : undefined}>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{partnerSplit.partner1_name}</p>
              <p className="text-xs text-muted-foreground">חוב אישי לקרן</p>
            </div>
            <p className={`text-xl font-extrabold ${summary.debtPartner1 > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {formatCurrency(summary.debtPartner1)}
            </p>
          </CardContent>
        </Card>
        <Card className={summary.debtPartner2 > 0 ? "border-destructive/40 bg-destructive/5" : undefined}>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{partnerSplit.partner2_name}</p>
              <p className="text-xs text-muted-foreground">חוב אישי לקרן</p>
            </div>
            <p className={`text-xl font-extrabold ${summary.debtPartner2 > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {formatCurrency(summary.debtPartner2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <PiggyBank className="h-4 w-4" strokeWidth={1.75} /> יומן תנועות
        </p>
        <Button variant="brand" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> רישום חדש
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">טוען...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">אין עדיין רישומים. לחצו על "רישום חדש" כדי להתחיל.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const Icon = typeIcons[entry.entry_type];
            const isNegativeForFund = entry.entry_type !== "received" && entry.entry_type !== "repayment";
            return (
              <Card key={entry.id}>
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isNegativeForFund ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{typeLabels[entry.entry_type]}</p>
                        {entry.partner && (
                          <Badge variant="outline" className="text-[10px]">
                            {entry.partner === "partner1" ? partnerSplit.partner1_name : partnerSplit.partner2_name}
                          </Badge>
                        )}
                        {entry.recipient_name && (
                          <Badge variant="secondary" className="text-[10px]">שולם ל: {entry.recipient_name}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.entry_date).toLocaleDateString("he-IL")}
                        {entry.note && ` · ${entry.note}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-bold ${isNegativeForFund ? "text-destructive" : "text-emerald-600"}`}>
                      {isNegativeForFund ? "-" : "+"}{formatCurrency(entry.amount)}
                    </p>
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(entry)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>רישום חדש בקרן הגבאים</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>סוג הרישום</Label>
              <Select value={form.entry_type} onValueChange={(v: GabbaiFundEntryType) => setForm({ ...form, entry_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gf-amount">סכום (₪)</Label>
                <Input id="gf-amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gf-date">תאריך</Label>
                <Input id="gf-date" type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
              </div>
            </div>
            {needsPartnerField && (
              <div className="space-y-1">
                <Label>מי מהשותפים</Label>
                <Select value={form.partner} onValueChange={(v: "partner1" | "partner2") => setForm({ ...form, partner: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partner1">{partnerSplit.partner1_name}</SelectItem>
                    <SelectItem value="partner2">{partnerSplit.partner2_name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.entry_type === "paid_to_gabbai" && (
              <div className="space-y-1">
                <Label htmlFor="gf-recipient">שולם ל (שם הגבאי)</Label>
                <Input id="gf-recipient" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="gf-note">הערות (לא חובה)</Label>
              <Textarea id="gf-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
            <Button variant="brand" onClick={saveEntry}>שמור רישום</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
