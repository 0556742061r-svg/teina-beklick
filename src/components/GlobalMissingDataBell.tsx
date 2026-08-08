import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useDevices, useInstallations } from "@/store/useStore";
import { Button } from "@/components/ui/button";

export function GlobalMissingDataBell() {
  const { devices } = useDevices();
  const { installations } = useInstallations();
  const [open, setOpen] = useState(false);

  const issues = useMemo(() => {
    const list: string[] = [];
    devices.forEach((d) => {
      if (!d.gabbai_phone) list.push(`${d.name}: חסר טלפון גבאי`);
      if (!d.address) list.push(`${d.name}: חסרה כתובת`);
      if (!d.gabbai_name) list.push(`${d.name}: חסר שם גבאי`);
    });
    installations.forEach((i) => {
      if (!i.phone) list.push(`${i.institution_name}: חסר טלפון`);
      if (!i.address) list.push(`${i.institution_name}: חסרה כתובת`);
    });
    return list;
  }, [devices, installations]);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen((o) => !o)}>
        <Bell className="h-4.5 w-4.5" strokeWidth={1.5} />
        {issues.length > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {issues.length}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute left-0 top-11 z-40 w-72 rounded-lg border border-border bg-popover p-3 shadow-elevated animate-fade-in">
          <p className="mb-2 text-sm font-semibold">נתונים חסרים</p>
          {issues.length === 0 ? (
            <p className="text-xs text-muted-foreground">אין נתונים חסרים כרגע 🎉</p>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto text-xs text-muted-foreground">
              {issues.map((issue, i) => (
                <li key={i} className="rounded-md bg-secondary/60 px-2 py-1.5">
                  {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
