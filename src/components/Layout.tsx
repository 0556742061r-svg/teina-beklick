import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { GlobalMissingDataBell } from "./GlobalMissingDataBell";
import { HelpButton } from "./HelpButton";

export function Layout({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
          <div>
            {title && <h1 className="text-lg font-bold">{title}</h1>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <GlobalMissingDataBell />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <HelpButton />
    </div>
  );
}
