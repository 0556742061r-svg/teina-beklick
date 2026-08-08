import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterEntries } from "@/store/useStore";
import { Upload, Plus, Search, ArrowLeftCircle, Phone } from "lucide-react";
import { toast } from "sonner";

type PrivacyFilter = "all" | "shared" | "private";
type SortMode = "traffic" | "rating";

function extractNumber(text: string) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

const emptyEntry = {
  institution_name: "", contact_person: "", phone: "", location: "", traffic: "", status: "חדש",
  source: "", notes: "", lead_rating: 5, is_private: false,
};

export default function DataFilterPage() {
  const { filterEntries, addFilterEntry, promoteFilterEntry } = useFilterEntries();
  const [search, setSearch] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyFilter>("all");
  const [sort, setSort] = useState<SortMode>("traffic");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyEntry);

  const filtered = useMemo(() => {
    let list = filterEntries.filter((f) =>
      [f.institution_name, f.contact_person, f.phone, f.location, f.notes].some((v) => v.includes(search))
    );
    if (privacy !== "all") list = list.filter((f) => (privacy === "private" ? f.is_private : !f.is_private));
    list = [...list].sort((a, b) =>
      sort === "traffic" ? extractNumber(b.traffic) - extractNumber(a.traffic) : b.lead_rating - a.lead_rating
    );
    return list;
  }, [filterEntries, search, privacy, sort]);

  function save() {
    if (!form.institution_name || !form.phone) {
      toast.error("יש למלא שם מוסד וטלפון");
      return;
    }
    addFilterEntry(form);
    toast.success("ליד נוסף לסינון");
    setForm(emptyEntry);
    setDialogOpen(false);
  }

  return (
    <Layout title="סינון נתונים" subtitle="עיבוד לידים גולמיים לפני העברה למעקב התקנות">
      <div className="mb-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="חיפוש בכל השדות..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={privacy} onValueChange={(v: PrivacyFilter) => setPrivacy(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="shared">משותף</SelectItem>
              <SelectItem value="private">פרטי</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: SortMode) => setSort(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="traffic">מיון: כמות אנשים</SelectItem>
              <SelectItem value="rating">מיון: דירוג ליד</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => toast.info("ייבוא Excel של לידים ייפתח כאן")}>
            <Upload className="h-3.5 w-3.5" /> ייבוא
          </Button>
          <Button variant="brand" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> ליד חדש
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((f) => (
          <Card key={f.id} className={f.is_private ? "border-primary/40" : undefined}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{f.institution_name}</p>
                    {f.is_private && <Badge>פרטי</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.location} · {f.source}</p>
                </div>
                <Badge variant="outline">{f.status}</Badge>
              </div>
              <p className="text-xs flex items-center gap-1.5 mb-1"><Phone className="h-3.5 w-3.5" strokeWidth={1.5} /> {f.contact_person} · {f.phone}</p>
              <p className="text-xs text-muted-foreground mb-2">כמות: {f.traffic || "לא צוין"}</p>
              {f.notes && <p className="text-xs bg-secondary/60 rounded-md p-2 mb-3">{f.notes}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">דירוג ליד</span>
                  <Badge variant={f.lead_rating >= 7 ? "accent" : f.lead_rating >= 4 ? "amber" : "outline"}>{f.lead_rating}/10</Badge>
                </div>
                <Button size="sm" variant="secondary" onClick={() => { promoteFilterEntry(f.id); toast.success("הועבר למעקב התקנות"); }}>
                  <ArrowLeftCircle className="h-3.5 w-3.5" /> העברה למעקב
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-10">אין לידים תואמים לסינון הנוכחי.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ליד חדש בסינון</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>שם מוסד</Label><Input className="mt-1" value={form.institution_name} onChange={(e) => setForm({ ...form, institution_name: e.target.value })} /></div>
              <div><Label>איש קשר</Label><Input className="mt-1" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>טלפון</Label><Input dir="ltr" className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>מיקום</Label><Input className="mt-1" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>כמות אנשים (חופשי)</Label><Input className="mt-1" value={form.traffic} onChange={(e) => setForm({ ...form, traffic: e.target.value })} /></div>
              <div><Label>מקור</Label><Input className="mt-1" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
            </div>
            <div>
              <Label>הערות</Label>
              <Textarea className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div>
              <div className="flex justify-between mb-1"><Label>דירוג ליד</Label><span className="text-xs text-muted-foreground">{form.lead_rating}/10</span></div>
              <Slider min={0} max={10} step={1} value={[form.lead_rating]} onValueChange={([v]) => setForm({ ...form, lead_rating: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="brand" onClick={save}>הוספה</Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
