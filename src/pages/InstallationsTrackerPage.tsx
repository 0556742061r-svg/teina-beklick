import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { CircularProgressGauge } from "@/components/CircularProgressGauge";
import { useInstallations } from "@/store/useStore";
import type { Installation } from "@/types";
import { categoryLabels } from "@/types";
import { Bell, CalendarClock, Send, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

const monthlyGoal = 5;
const dailyGoal = 1;

function milestoneCount(i: Installation) {
  return [i.milestone_contact, i.milestone_agreement, i.milestone_survey, i.milestone_installed].filter(Boolean).length;
}

export default function InstallationsTrackerPage() {
  const { installations, updateInstallation } = useInstallations();
  const [scheduling, setScheduling] = useState<Installation | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  const sorted = useMemo(
    () => [...installations].sort((a, b) => Number(a.milestone_installed) - Number(b.milestone_installed)),
    [installations]
  );

  const installedThisMonth = installations.filter((i) => i.milestone_installed).length;
  const goalPercent = Math.min(100, Math.round((installedThisMonth / monthlyGoal) * 100));

  function toggleMilestone(inst: Installation, key: keyof Pick<Installation, "milestone_contact" | "milestone_agreement" | "milestone_survey" | "milestone_installed">) {
    const nextVal = !inst[key];
    updateInstallation(inst.id, { [key]: nextVal } as Partial<Installation>);
    if (key === "milestone_installed" && nextVal) {
      toast.success(`${inst.institution_name} הומר למכשיר פעיל`);
    }
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
    toast.success("תיאום התקנה נשמר, תזכורת תישלח שעה לפני");
    setScheduling(null);
  }

  const upcoming = installations
    .filter((i) => i.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

  return (
    <Layout title="מעקב התקנות" subtitle="הדף המרכזי לניהול צנרת ההתקנות">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card className="lg:col-span-1 bg-gradient-brand text-white overflow-visible">
          <CardContent className="pt-6 flex flex-col items-center pb-9">
            <CircularProgressGauge value={goalPercent} label={`${installedThisMonth}/${monthlyGoal} יעד חודשי`} onGoalReached={fireConfetti} />
            <p className="text-xs text-white/80 mt-8">יעד יומי: {dailyGoal} התקנות</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><CalendarClock className="h-4 w-4" strokeWidth={1.5} /> משימות קרובות</p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין התקנות מתואמות כרגע.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-xs bg-secondary/60 rounded-md px-3 py-2">
                    <span className="font-medium">{i.institution_name}</span>
                    <span className="text-muted-foreground">{new Date(i.scheduled_at!).toLocaleString("he-IL")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((inst) => (
          <Card key={inst.id} className={inst.has_active_reminder ? "ring-2 ring-violet" : undefined}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{inst.institution_name}</p>
                    {inst.has_active_reminder && <Bell className="h-3.5 w-3.5 text-violet animate-pulse" strokeWidth={1.75} />}
                    {inst.is_private && <Badge>פרטי</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{categoryLabels[inst.institution_type]}</p>
                </div>
                <Badge variant={inst.milestone_installed ? "accent" : "amber"}>
                  {inst.milestone_installed ? "הותקן" : `${milestoneCount(inst)}/4`}
                </Badge>
              </div>

              <p className="text-xs flex items-center gap-1.5 mt-2"><Phone className="h-3.5 w-3.5" strokeWidth={1.5} /> {inst.contact_person} · {inst.phone}</p>
              <p className="text-xs flex items-center gap-1.5 mt-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {inst.address}</p>

              <div className="grid grid-cols-2 gap-2 my-3">
                {([
                  ["milestone_contact", "יצירת קשר"],
                  ["milestone_agreement", "סיכום/הסכמה"],
                  ["milestone_survey", "סקר"],
                  ["milestone_installed", "התקנה"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs rounded-md border border-border px-2 py-1.5 cursor-pointer">
                    <Checkbox checked={inst[key]} onCheckedChange={() => toggleMilestone(inst, key)} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openSchedule(inst)}>
                  <CalendarClock className="h-3.5 w-3.5" /> תיאום התקנה
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toast.success("הליד נשלח לשותף למייל")}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!scheduling} onOpenChange={(o) => !o && setScheduling(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>תיאום התקנה -- {scheduling?.institution_name}</DialogTitle></DialogHeader>
          <div>
            <Label>תאריך ושעה</Label>
            <Input type="datetime-local" className="mt-1" dir="ltr" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
            <p className="text-[11px] text-muted-foreground mt-1">תזכורת תיווצר אוטומטית שעה לפני המועד שנקבע.</p>
          </div>
          <DialogFooter>
            <Button variant="brand" onClick={saveSchedule}>שמירה</Button>
            <Button variant="outline" onClick={() => setScheduling(null)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
