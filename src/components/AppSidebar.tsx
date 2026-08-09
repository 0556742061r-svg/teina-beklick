import { NavLink } from "react-router-dom";
import { LayoutDashboard, Smartphone, Wallet, ListFilter, ClipboardCheck, LogOut, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "דשבורד", icon: LayoutDashboard },
  { to: "/devices", label: "מכשירים", icon: Smartphone },
  { to: "/finances", label: "כספים", icon: Wallet },
  { to: "/data-filter", label: "סינון נתונים", icon: ListFilter },
  { to: "/installations", label: "מעקב התקנות", icon: ClipboardCheck },
  { to: "/installation-points", label: "נקודות התקנה", icon: MapPin },
];

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="mb-4 rounded-lg bg-white p-4 shadow-elevated">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-brand text-white font-extrabold text-sm">TK</div>
          <div>
            <p className="text-sm font-bold leading-tight">טעינה בקליק</p>
            <p className="text-[11px] text-muted-foreground leading-tight">ניהול רב-קו</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white text-foreground shadow-elevated" : "text-white/90 hover:bg-white/15"
              )
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-lg bg-white/10 p-3">
        <p className="text-[11px] text-white/80 mb-2">מחוברים כאדמין</p>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/90 hover:bg-white/15">
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          התנתקות
        </button>
      </div>
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col shrink-0 bg-gradient-brand p-3">
      <SidebarInner />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative flex w-72 max-w-[85vw] flex-col bg-gradient-brand p-3">
        <button
          onClick={onClose}
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mt-10">
          <SidebarInner onNavigate={onClose} />
        </div>
      </aside>
    </div>
  );
}
