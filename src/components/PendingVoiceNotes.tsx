import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useExpenses } from "@/store/useStore";
import type { VoiceExpenseNote, PartnerSplit } from "@/types";
import { Trash2, Mic, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  partnerSplit: PartnerSplit;
}

interface Draft {
  description: string;
  amount: string;
  category: string;
  payer: "partner1" | "partner2";
}

const emptyDraft: Draft = { description: "", amount: "", category: "", payer: "partner1" };

export function PendingVoiceNotes({ partnerSplit }: Props) {
  const { addExpense } = useExpenses();
  const [notes, setNotes] = useState<VoiceExpenseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("voice_expense_notes")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (!error && data) setNotes(data as VoiceExpenseNote[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("voice_expense_notes_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "voice_expense_notes" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  function draftFor(id: string): Draft {
    return drafts[id] ?? emptyDraft;
  }
  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...draftFor(id), ...patch } }));
  }

  async function convert(note: VoiceExpenseNote) {
    const d = draftFor(note.id);
    if (!d.description || !d.amount) {
      toast.error("יש למלא תיאור וסכום לפני ההמרה להוצאה");
      return;
    }
    addExpense({
      description: d.description,
      amount: Number(d.amount),
      category: d.category || "תפעול",
      date: new Date().toISOString().slice(0, 10),
      payer: d.payer,
    });
    const { error } = await supabase
      .from("voice_expense_notes")
      .update({
        status: "converted",
        transcribed_text: d.description,
        amount: Number(d.amount),
        category: d.category,
        payer: d.payer,
      })
      .eq("id", note.id);
    if (error) {
      toast.error("ההוצאה נוספה, אך עדכון סטטוס ההקלטה נכשל");
    } else {
      toast.success("ההוצאה נוספה וההקלטה סומנה כטופלה");
    }
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
  }

  async function remove(note: VoiceExpenseNote) {
    const { error } = await supabase.from("voice_expense_notes").delete().eq("id", note.id);
    if (error) {
      toast.error("מחיקת ההקלטה נכשלה");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
  }

  if (!loading && notes.length === 0) return null;

  return (
    <Card className="mb-6 border-orange-400/40 bg-orange-500/5">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Mic className="h-4 w-4 text-orange-500" strokeWidth={1.75} />
          הקלטות ממתינות לתמלול {notes.length > 0 && `(${notes.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className="text-xs text-muted-foreground">טוען הקלטות...</p>}
        {notes.map((note) => {
          const d = draftFor(note.id);
          return (
            <div key={note.id} className="rounded-lg border border-border bg-background p-3 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <audio controls src={note.audio_url} className="w-full max-w-sm" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(note.created_at).toLocaleString("he-IL")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="תיאור ההוצאה (אחרי ההאזנה)"
                  value={d.description}
                  onChange={(e) => setDraft(note.id, { description: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="סכום"
                  value={d.amount}
                  onChange={(e) => setDraft(note.id, { amount: e.target.value })}
                />
                <Input
                  placeholder="קטגוריה"
                  value={d.category}
                  onChange={(e) => setDraft(note.id, { category: e.target.value })}
                />
                <Select value={d.payer} onValueChange={(v: "partner1" | "partner2") => setDraft(note.id, { payer: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partner1">{partnerSplit.partner1_name}</SelectItem>
                    <SelectItem value="partner2">{partnerSplit.partner2_name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => remove(note)}>
                  <Trash2 className="h-3.5 w-3.5" /> מחק
                </Button>
                <Button variant="brand" size="sm" onClick={() => convert(note)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> המר להוצאה
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
