import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircularProgressGauge } from "@/components/CircularProgressGauge";
import { useInstallations, useDevices } from "@/store/useStore";
import type { Installation, InstallationTaskType } from "@/types";
import { categoryLabels, taskTypeLabels, taskTypeMilestoneLabels } from "@/types";
import { Bell, CalendarClock, Send, Phone, MapPin, Plus, BellRing, Search, Trophy, Flame } from "lucide-react";
import { toast } from "sonner";

const emptyTask: Omit<Installation, "id" | "created_at"> = {
  institution_name: "", phone: "", contact_person: "", address: "",
  institution_type: "synagogue", task_type: "new",
  notes: "", status: "חדש", source_type: "direct", is_private: false,
  milestone_contact: false, milestone_agreement: false, milestone_survey: false, milestone_installed: false,
  monthly_goal: 25,
};

function milestoneCount(i: Installation) {
  return [i.milestone_contact, i.milestone_agreement, i.milestone_survey, i.milestone_installed].filter(Boolean).length;
}
function isDone(i: Installation) {
  return i.milestone_installed;
}
function isToday(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

const milestoneKeys = ["milestone_contact", "milestone_agreement", "milestone_survey", "milestone_installed"] as const;

export default function InstallationsTrackerPage() {
  const { installations, addInstallation, updateInstallation, removeInstallation } = useInstallations();
  const { devices } = useDevices();

  const [monthlyGoal, setMonthlyGoal] = useState(25);
  const [dailyGoal, setDailyGoal] = useState(2);
  const [editingGoal, setEditingGoal] = useState<"monthly" | "daily" | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<InstallationTaskType | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "direct" | "filter">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "done">("all");

  const [scheduling, setScheduling] = useState<Installation | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyTask);

  const filtered = useMemo(() => {
    return installations
      .filter((i) => typeFilter === "all" || i.task_type === typeFilter)
      .filter((i) => sourceFilter === "all" || i.source_type === sourceFilter)
      .filter((i) => {
        if (statusFilter === "all") return true;
        const count = milestoneCount(i);
        if (statusFilter === "open") return count === 0;
        if (statusFilter === "done") return isDone(i);
        return count > 0 && !isDone(i);
      })
      .filter((i) =>
        [i.institution_name, i.contact_person, i.phone, i.address].some((v) => v.includes(search))
      )
      .sort((a, b) => Number(isDone(a)) - Number(isDone(b)));
  }, [installations, typeFilter, sourceFilter, statusFilter, search]);

  const closedToday = installations.filter((i) => isDone(i) && isToday(i.closed_at)).length;
  const closedThisMonth = installations.filter((i) => isDone(i)).length;
  const pending = installations.filter((i) => !isDone(i)).length;
  const activeDevices = devices.filter((d) => d.status === "active").length;
  const goalPercent = Math.min(100, Math.round((closedThisMonth / monthlyGoal) * 100));

  // Simple streak: consecutive days (counting back from today) with at least one closed task.
  const streak = useMemo(() => {
    const closedDates = new Set(
      installations.filter((i) => isDone(i) && i.closed_at).map((i) => new Date(i.closed_at!).toDateString())
    );
    let count = 0;
    const cursor = new Date();
    while (closedDates.has(cursor.toDateString())) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [installations]);

  function toggleMilestone(inst: Installation, key: (typeof milestoneKeys)[number]) {
    const nextVal = !inst[key];
    const patch: Partial<Installation> = { [key]: nextVal } as Partial<Installation>;
    if (key === "milestone_installed" && nextVal) {
      patch.closed_at = new Date().toISOString();
      toast.success(
        inst.task_type === "new" ? `${inst.institution_name} הומר למכשיר פעיל` : `${inst.institution_name} סומן כהושלם`
      );
    }
    updateInstallation(inst.id, patch);
  }

  function toggleReminder(inst: Installation) {
    updateInstallation(inst.id, { has_active_reminder: !inst.has_active_reminder });
    toast.info(inst.has_active_reminder ? "התזכורת בוטלה" : "תזכורת הופעלה");
  }

  function fireConfetti() {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    toast.success("יעד חודשי הושג! 🎉");
  }

  function openSchedule(inst: Installation) {
    setScheduling(inst);
    setScheduleDate(inst.scheduled_at ? inst.scheduled_at.slice(0, 16) : "");
  }
  function saveSchedule() {
    if (!scheduling || !scheduleDate) return;
    updateInstallation(scheduling.id, { scheduled_at: new Date(scheduleDate).toISOString() });
    toast.success("התיאום נשמר, תזכורת תישלח שעה לפני");
    setScheduling(null);
  }

  function saveNewTask() {
    if (!form.institution_name || !form.phone) {
      toast.error("יש למלא שם וטלפון");
      return;
    }
    addInstallation(form);
    toast.success("נוסף בהצלחה");
    setForm(emptyTask);
    setNewDialogOpen(false);
  }

  const upcoming = installations
    .filter((i) => i.scheduled_at && !isDone(i))
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

  return (
    <Layout title="מעקב התקנות" subtitle="הדף המרכזי לניהול צנרת ההתקנות, השדרוגים והתיקונים">
      {/* Progress banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <Card className="lg:col-span-3 bg-gradient-brand text-white overflow-visible">
          <CardContent className="pt-6 pb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5 mb-1">
                <Trophy className="h-4 w-4" strokeWidth={1.75} /> התקדמות התקנות
              </p>
              <button
                className="text-xs text-white/80 underline decoration-dotted"
                onClick={() => {
                  const v = window.prompt("יעד חודשי חדש:", String(monthlyGoal));
                  if (v && Number(v) > 0) setMonthlyGoal(Number(v));
                }}
              >
                יעד חודשי: {monthlyGoal}
              </button>
            </div>
            <CircularProgressGauge value={goalPercent} label={`${closedThisMonth}/${monthlyGoal}`} onGoalReached={fireConfetti} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardContent className="pt-5">
            <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><CalendarClock className="h-4 w-4" strokeWidth={1.5} /> משימות קרובות</p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין התקנות מתואמות כרגע.</p>
            ) : (
              <ul className="space-y-2 max-h-24 overflow-y-auto">
                {upcoming.map((i) => (
                  <li key={i.id} className="text-xs bg-secondary/60 rounded-md px-3 py-2">
                    <p className="font-medium">{i.institution_name}</p>
                    <p className="text-muted-foreground">{new Date(i.scheduled_at!).toLocaleString("he-IL")}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card><CardContent className="pt-5"><p className="text-2xl font-extrabold text-primary">{closedToday}</p><p className="text-xs text-muted-foreground mt-1">נסגרו היום</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-2xl font-extrabold text-amber-500">{streak}</p><p className="text-xs text-muted-foreground mt-1">רצף ימים</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-2xl font-extrabold text-violet-500">{pending}</p><p className="text-xs text-muted-foreground mt-1">ממתינים לטיפול</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-2xl font-extrabold text-accent">{activeDevices}</p><p className="text-xs text-muted-foreground mt-1">מכשירים פעילים</p></CardContent></Card>
      </div>

      {/* Daily goal */}
      <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
          <span className="text-sm">יעד יומי:</span>
          <button
            className="text-sm font-bold underline decoration-dotted"
            onClick={() => {
              const v = window.prompt("יעד יומי חדש:", String(dailyGoal));
              if (v && Number(v) > 0) setDailyGoal(Number(v));
            }}
          >
            {dailyGoal}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {Math.max(0, dailyGoal - closedToday)} סגירות נותרו היום כדי להישאר ביעד
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="brand" size="sm" onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> משימה חדשה
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("הגדרות תזכורות ייפתחו כאן")}>
            <BellRing className="h-3.5 w-3.5" /> הגדרות תזכורות
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={typeFilter} onValueChange={(v: InstallationTaskType | "all") => setTypeFilter(v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="כל הסוגים" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוגים</SelectItem>
              {Object.entries(taskTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v: "all" | "direct" | "filter") => setSourceFilter(v)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="כל המקורות" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המקורות</SelectItem>
              <SelectItem value="direct">ישיר</SelectItem>
              <SelectItem value="filter">מסלול</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: "all" | "open" | "in_progress" | "done") => setStatusFilter(v)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="כל הסטטוסים" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="open">פתוח</SelectItem>
              <SelectItem value="in_progress">בטיפול</SelectItem>
              <SelectItem value="done">הושלם</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="חיפוש לפי שם, איש קשר, כתובת..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9 w-56" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">
          {installations.length === 0 ? "אין עדיין משימות. לחצו על \"משימה חדשה\" כדי להתחיל." : "אין תוצאות תואמות לסינון הנוכחי."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inst) => {
            const labels = taskTypeMilestoneLabels[inst.task_type];
            return (
              <Card key={inst.id} className={inst.has_active_reminder ? "ring-2 ring-violet-400" : undefined}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{inst.institution_name}</p>
                        <Badge variant="secondary" className="text-[10px]">{taskTypeLabels[inst.task_type]}</Badge>
                        <Badge variant="outline" className="text-[10px]">{categoryLabels[inst.institution_type]}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {inst.phone}</span>
                        {inst.address && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {inst.address}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className={inst.has_active_reminder ? "text-violet-500" : "text-muted-foreground"}
                      onClick={() => toggleReminder(inst)}
                      title="תזכורת"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                  </div>

                  {inst.notes && <p className="text-xs text-muted-foreground mt-2">{inst.notes}</p>}

                  {inst.scheduled_at && !isDone(inst) && (
                    <p className="text-xs text-accent mt-2 flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> מתואם ל-{new Date(inst.scheduled_at).toLocaleString("he-IL")}
                    </p>
                  )}

                  <div className="grid grid-cols-4 gap-1 mt-3">
                    {milestoneKeys.map((key, idx) => (
                      <label key={key} className="flex flex-col items-center gap-1 text-center cursor-pointer">
                        <Checkbox checked={!!inst[key]} onCheckedChange={() => toggleMilestone(inst, key)} />
                        <span className="text-[10px] text-muted-foreground leading-tight">{labels[idx]}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => openSchedule(inst)}>
                      <CalendarClock className="h-3.5 w-3.5" /> תאם מועד
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${inst.phone}`}><Phone className="h-3.5 w-3.5" /> חייג</a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://wa.me/${inst.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        <Send className="h-3.5 w-3.5" /> וואטסאפ
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive mr-auto"
                      onClick={() => removeInstallation(inst.id)}
                    >
                      מחק
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule dialog */}
      <Dialog open={!!scheduling} onOpenChange={(open) => !open && setScheduling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>תיאום מועד ל{scheduling?.institution_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="schedule-date">תאריך ושעה</Label>
            <Input
              id="schedule-date"
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduling(null)}>ביטול</Button>
            <Button variant="brand" onClick={saveSchedule}>שמור תיאום</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New task dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>משימה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-name">שם המוסד *</Label>
                <Input id="new-name" value={form.institution_name} onChange={(e) => setForm({ ...form, institution_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-phone">טלפון *</Label>
                <Input id="new-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-contact">איש קשר</Label>
                <Input id="new-contact" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-address">כתובת</Label>
                <Input id="new-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>סוג משימה</Label>
                <Select value={form.task_type} onValueChange={(v: InstallationTaskType) => setForm({ ...form, task_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>סוג מוסד</Label>
                <Select value={form.institution_type} onValueChange={(v) => setForm({ ...form, institution_type: v as Installation["institution_type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-notes">הערות</Label>
              <Textarea id="new-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>ביטול</Button>
            <Button variant="brand" onClick={saveNewTask}>הוסף משימה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
