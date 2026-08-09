import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import type { InstallationPoint } from "@/types";
import { MapPin, Camera, Navigation, Trash2, Loader2, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function InstallationPointsPage() {
  const [points, setPoints] = useState<InstallationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPoints() {
    setLoading(true);
    const { data, error } = await supabase
      .from("installation_points")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("שגיאה בטעינת הנקודות מהשרת");
      console.error(error);
    } else {
      setPoints((data as InstallationPoint[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPoints();
  }, []);

  function openNewDialog() {
    setTitle("");
    setNotes("");
    setCoords(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
    captureLocation();
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      toast.error("הדפדפן לא תומך באיתור מיקום");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("המיקום נקלט בהצלחה");
      },
      (err) => {
        setLocating(false);
        toast.error("לא הצלחנו לקבל מיקום -- ודא שנתת הרשאת מיקום לדפדפן");
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function savePoint() {
    if (!title.trim()) {
      toast.error("יש לתת שם/כותרת לנקודה");
      return;
    }
    if (!coords) {
      toast.error("יש לאתר מיקום לפני השמירה");
      return;
    }
    setSaving(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        const path = `${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("installation-photos")
          .upload(path, photoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("installation-photos")
          .getPublicUrl(path);
        photo_url = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from("installation_points").insert({
        title: title.trim(),
        lat: coords.lat,
        lng: coords.lng,
        photo_url,
        notes: notes.trim() || null,
        status: "pending",
      });
      if (error) throw error;

      toast.success("הנקודה נשמרה בהצלחה");
      setDialogOpen(false);
      loadPoints();
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשמירת הנקודה");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(p: InstallationPoint) {
    const newStatus = p.status === "pending" ? "installed" : "pending";
    const { error } = await supabase
      .from("installation_points")
      .update({ status: newStatus })
      .eq("id", p.id);
    if (error) {
      toast.error("שגיאה בעדכון הסטטוס");
      return;
    }
    setPoints((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: newStatus } : x)));
  }

  async function deletePoint(id: string) {
    const { error } = await supabase.from("installation_points").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקה");
      return;
    }
    setPoints((prev) => prev.filter((x) => x.id !== id));
    toast.success("הנקודה נמחקה");
  }

  return (
    <Layout title="נקודות התקנה" subtitle="סימון מיקום מדויק + תמונה עבור המתקין">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{points.length} נקודות נשמרו</p>
        <Button variant="brand" size="sm" onClick={openNewDialog}>
          <Plus className="h-3.5 w-3.5" /> סמן נקודה חדשה
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> טוען נקודות...
        </div>
      ) : points.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          עדיין לא סומנו נקודות. עמוד במקום המדויק ולחץ על "סמן נקודה חדשה".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {points.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-24 bg-gradient-brand-soft flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary/40" strokeWidth={1.25} />
                </div>
              )}
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm">{p.title}</p>
                  <Badge variant={p.status === "installed" ? "accent" : "amber"}>
                    {p.status === "installed" ? "הותקן" : "ממתין"}
                  </Badge>
                </div>
                {p.notes && <p className="text-xs text-muted-foreground mb-3">{p.notes}</p>}
                <p className="text-[11px] text-muted-foreground mb-3 font-mono" dir="ltr">
                  {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation className="h-3.5 w-3.5" /> ניווט
                    </a>
                  </Button>
                  <Button
                    variant={p.status === "installed" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleStatus(p)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deletePoint(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>סימון נקודת התקנה</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>שם / כותרת (למשל: שם המוסד או החנות)</Label>
              <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>מיקום</Label>
              <div className="mt-1 flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={captureLocation} disabled={locating}>
                  {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                  {locating ? "מאתר..." : "אתר מיקום מחדש"}
                </Button>
                {coords && (
                  <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <Label>תמונה של הנקודה המדויקת</Label>
              <div className="mt-1 flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-3.5 w-3.5" /> צלם / בחר תמונה
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              {photoPreview && (
                <img src={photoPreview} alt="preview" className="mt-2 h-32 rounded-lg object-cover border border-border" />
              )}
            </div>

            <div>
              <Label>הערה (לא חובה)</Label>
              <Textarea className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='למשל: "ליד הכניסה, שקע כחול"' />
            </div>
          </div>
          <DialogFooter>
            <Button variant="brand" onClick={savePoint} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              שמירה
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
