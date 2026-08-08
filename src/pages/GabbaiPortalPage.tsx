import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDevices } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { Smartphone, Wallet, MapPin } from "lucide-react";

// Demo: showing the portal as seen by the gabbai linked to the first device.
export default function GabbaiPortalPage() {
  const { devices } = useDevices();
  const myDevices = devices.slice(0, 2);
  const totalRevenue = myDevices.reduce((s, d) => s + d.monthly_revenue, 0);
  const totalCommission = myDevices.reduce((s, d) => s + (d.monthly_revenue * d.commission_percent) / 100, 0);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-gradient-brand p-6 text-white">
        <p className="text-sm text-white/80">פורטל גבאים</p>
        <h1 className="text-2xl font-extrabold">שלום, {myDevices[0]?.gabbai_name ?? "גבאי"}</h1>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">הכנסה חודשית כוללת</p>
              <p className="text-xl font-extrabold text-primary">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">עמלה שקיבלתי</p>
              <p className="text-xl font-extrabold text-accent">{formatCurrency(totalCommission)}</p>
            </CardContent>
          </Card>
        </div>

        <p className="text-sm font-semibold pt-2">המכשירים שלי</p>
        {myDevices.map((d) => (
          <Card key={d.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" strokeWidth={1.5} /> {d.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {d.address}
                </p>
              </div>
              <div className="text-left">
                <Badge variant="accent">{d.status === "active" ? "פעיל" : d.status}</Badge>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 justify-end">
                  <Wallet className="h-3.5 w-3.5" strokeWidth={1.5} /> {formatCurrency(d.monthly_revenue)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
