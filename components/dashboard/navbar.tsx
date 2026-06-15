"use client";

import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export type Section = "library" | "create";

interface Props {
  section: Section;
  onSection: (next: Section) => void;
}

const TABS: { key: Section; label: string }[] = [
  { key: "library", label: "Library" },
  { key: "create", label: "Create" },
];

export function Navbar({ section, onSection }: Props) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Suvichaar Admin</span>
        </div>

        <nav className="inline-flex rounded-lg border border-border bg-secondary/50 p-1" role="tablist" aria-label="Sections">
          {TABS.map((t) => {
            const active = t.key === section;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => onSection(t.key)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user?.email && (
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
