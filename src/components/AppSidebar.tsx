import { NavLink } from "react-router-dom";
import { LayoutDashboard, Smartphone, Wallet, ListFilter, ClipboardCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "דשבורד", icon: LayoutDashboard },
  { to: "/devices", label: "מכשירים", icon: Smartphone },
  { to: "/finances", label: "כספים", icon: Wallet },
  { to: "/data-filter", label: "סינון נתונים", icon: ListFilter },
  { to: "/installations", label: "מעקב התקנות", icon: ClipboardCheck },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col shrink-0 bg-gradient-brand p-3">
      <div className="mb-4 rounded-lg bg-white p-4 shadow-elevated">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-brand text-white font-extrabold text-sm">TK</div>
          <div>
            <p className="text-sm font-bold leading-tight">טעינה בקליק</p>
            <p className="text-[11px] text-muted-foreground leading-tight">ניהול ערך צבור</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
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
    </aside>
  );
}
