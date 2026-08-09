import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { AppSidebar, MobileSidebar } from "./AppSidebar";
import { GlobalMissingDataBell } from "./GlobalMissingDataBell";
import { HelpButton } from "./HelpButton";

export function Layout({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary md:hidden"
              aria-label="פתח תפריט"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <div>
              {title && <h1 className="text-lg font-bold">{title}</h1>}
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlobalMissingDataBell />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <HelpButton />
    </div>
  );
}
