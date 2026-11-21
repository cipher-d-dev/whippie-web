"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * Layout: the sidebar sits on the neutral canvas and the page lives in a white
 * panel beside it. Below lg the sidebar moves into a slide-out drawer.
 * <aside> and <header> stay semantic: the letter-print styles hide them.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen gap-2 bg-canvas p-0 lg:p-2">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <div className="sticky top-2 hidden h-[calc(100vh-1rem)] shrink-0 lg:block">
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-background lg:rounded-2xl lg:border">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur lg:top-2 lg:rounded-t-2xl lg:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[252px] bg-canvas p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <Header />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-7" id="main-content">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
