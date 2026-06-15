"use client";

import { useMemo } from "react";
import { Calendar, FileText, Newspaper, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { UnifiedStory } from "@/lib/api/stories";

interface Props {
  stories: UnifiedStory[];
  totals: { news: number; curious: number; combined: number };
}

export function StatsRow({ stories, totals }: Props) {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const createdToday = stories.filter(
      (s) => s.created_at && new Date(s.created_at).toDateString() === today
    ).length;

    return [
      { label: "Total Stories", value: totals.combined, icon: FileText, accent: "text-foreground" },
      { label: "News", value: totals.news, icon: Newspaper, accent: "text-blue-500 dark:text-blue-400" },
      { label: "Curious", value: totals.curious, icon: Sparkles, accent: "text-violet-500 dark:text-violet-400" },
      { label: "Created Today", value: createdToday, icon: Calendar, accent: "text-emerald-500 dark:text-emerald-400" },
    ];
  }, [stories, totals]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <Card
          key={s.label}
          className="flex items-center justify-between p-4 transition-colors hover:border-foreground/20"
        >
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
              {s.value}
            </div>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-secondary ${s.accent}`}>
            <s.icon className="h-4 w-4" />
          </div>
        </Card>
      ))}
    </div>
  );
}
