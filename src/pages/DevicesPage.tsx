import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDevices } from "@/store/useStore";
import type { Device, DeviceCategory, DeviceStatus } from "@/types";
import { categoryLabels, statusLabels } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, Phone, MapPin, Upload, ImageIcon, Search } from "lucide-react";
import { toast } from "sonner";

const emptyDevice: Omit<Device, "id" | "created_at"> = {
  name: "", category: "synagogue", address: "", status: "active", purchase_price: 4200,
  monthly_revenue: 0, roi_enabled: true, gabbai_name: "", gabbai_phone: "", commission_percent: 8, device_count: 1,
};

export default function DevicesPage() {
  const { devices, addDevice, updateDevice, removeDevice } = useDevices();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [form, setForm] = useState<Omit<Device, "id" | "created_at">>(emptyDevice);
  const [geocoding, setGeocoding] = useState(false);

  const filtered = useMemo(
    () =>
      devices.filter(
        (d) =>
          d.name.includes(search) || d.address.includes(search) || d.gabbai_name.includes(search)
      ),
    [devices, search]
  );

  function openNew() {
    setEditing(null);
    setForm(emptyDevice);
    setDialogOpen(true);
  }
  function openEdit(d: Device) {
    setEditing(d);
    setForm(d);
    setDialogOpen(true);
  }
  function handleGeocode() {
    if (!form.address) return;
    setGeocoding(true);
    setTimeout(() => {
      setGeocoding(false);
      toast.success("הכתובת אותרה בהצלחה (דיוק ברמת בית)");
    }, 700);
  }
  function save() {
    if (!form.name || !form.address) {
      toast.error("יש למלא שם וכתובת");
      return;
    }
    if (editing) {
      updateDevice(editing.id, form);
      toast.success("המכשיר עודכן");
    } else {
      addDevice(form);
      toast.success("מכשיר חדש נוסף");
    }
    setDialogOpen(false);
  }

  return (
    <Layout title="רשימת מכשירים" subtitle={`${devices.length} מכשירים במערכת`}>
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="חיפוש לפי שם, כתובת או גבאי..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("ייבוא Excel של מכשירים ייפתח כאן")}>
            <Upload className="h-3.5 w-3.5" />
            ייבוא Excel
          </Button>
          <Button variant="brand" size="sm" onClick={openNew}>
            <Plus className="h-3.5 w-3.5" />
            מכשיר חדש
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <Card key={d.id} className="overflow-hidden">
            <div className="h-24 bg-gradient-brand-soft flex items-center justify-center">
              {d.image_url ? (
                <img src={d.image_url} alt={d.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-primary/40" strokeWidth={1.25} />
              )}
            </div>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{d.name}</p>
                  <Select value={d.category} onValueChange={(v: DeviceCategory) => updateDevice(d.id, { category: v })}>
                    <SelectTrigger className="h-7 mt-1 text-xs w-fit border-none shadow-none px-0 bg-transparent gap-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant={d.status === "active" ? "accent" : d.status === "maintenance" ? "amber" : "outline"}>
                  {statusLabels[d.status]}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground mb-3">
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {d.address}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" strokeWidth={1.5} /> {d.gabbai_name} · {d.gabbai_phone}</p>
              </div>

              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-muted-foreground">עמלה: <b className="text-foreground">{d.commission_percent}%</b></span>
                <span className="text-muted-foreground">הכנסה חודשית: <b className="text-foreground">{formatCurrency(d.monthly_revenue)}</b></span>
              </div>

              {d.roi_enabled && (
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>החזר השקעה (ROI)</span>
                    <span>{Math.min(100, Math.round((d.monthly_revenue * 3 / d.purchase_price) * 100))}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-brand"
                      style={{ width: `${Math.min(100, Math.round((d.monthly_revenue * 3 / d.purchase_price) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(d)}>
                  <Pencil className="h-3.5 w-3.5" /> עריכה
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => { removeDevice(d.id); toast.success("המכשיר נמחק"); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "עריכת מכשיר" : "מכשיר חדש"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>שם המוסד</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>קטגוריה</Label>
              <Select value={form.category} onValueChange={(v: DeviceCategory) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>כתובת</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <Button type="button" variant="outline" size="sm" onClick={handleGeocode} disabled={geocoding}>
                  {geocoding ? "מאתר..." : "איתור"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">הקואורדינטות יתקבלו אוטומטית ולא יוצגו למשתמש.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>שם גבאי</Label>
                <Input className="mt-1" value={form.gabbai_name} onChange={(e) => setForm({ ...form, gabbai_name: e.target.value })} />
              </div>
              <div>
                <Label>טלפון גבאי</Label>
                <Input className="mt-1" dir="ltr" value={form.gabbai_phone} onChange={(e) => setForm({ ...form, gabbai_phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>אחוז עמלה</Label>
                <Input className="mt-1" type="number" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })} />
              </div>
              <div>
                <Label>סטטוס</Label>
                <Select value={form.status} onValueChange={(v: DeviceStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>מחיר רכישה</Label>
                <Input className="mt-1" type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })} />
              </div>
              <div>
                <Label>הכנסה חודשית</Label>
                <Input className="mt-1" type="number" value={form.monthly_revenue} onChange={(e) => setForm({ ...form, monthly_revenue: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>מעקב ROI</Label>
              <Switch checked={form.roi_enabled} onCheckedChange={(v) => setForm({ ...form, roi_enabled: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="brand" onClick={save}>{editing ? "שמירה" : "הוספה"}</Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
