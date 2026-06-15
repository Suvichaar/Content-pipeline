"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { StatsRow } from "./stats-row";
import { FiltersBar } from "./filters-bar";
import { StoriesTable } from "./stories-table";
import { PreviewSheet } from "./preview-sheet";
import { PublishDialog } from "./publish-dialog";
import { useStories } from "@/hooks/use-stories";
import type { UnifiedStory } from "@/lib/api/stories";
import type { Filters } from "@/lib/types";

const INITIAL_FILTERS: Filters = {
  search: "",
  mode: "all",
  category: "all",
  date: "all",
};

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [previewStory, setPreviewStory] = useState<UnifiedStory | null>(null);
  const [publishStory, setPublishStory] = useState<UnifiedStory | null>(null);

  const apiFilters = useMemo(
    () => ({
      mode: filters.mode === "all" ? undefined : filters.mode,
      category: filters.category === "all" ? undefined : filters.category,
      q: filters.search.trim() || undefined,
      ...dateRangeFromFilter(filters.date),
      limit: 100,
    }),
    [filters]
  );

  const { data, isLoading, isError, error } = useStories(apiFilters);

  const stories = data?.items ?? [];
  const totals = data?.totals ?? { news: 0, curious: 0, combined: 0 };
  const errors = data?.errors ?? [];

  return (
    <>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Stories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview AI-generated stories and publish them to live destinations.
          </p>
        </div>
        <div className="hidden text-xs text-muted-foreground sm:block">
          <span className="tabular-nums">{stories.length}</span> of{" "}
          <span className="tabular-nums">{totals.combined}</span>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">Some engines failed to load</div>
            {errors.map((e) => (
              <div key={e.engine} className="mt-0.5 text-xs">
                {e.engine === "news" ? "News" : "Curious"} engine: {e.error}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
        <StatsRow stories={stories} totals={totals} />
        <FiltersBar filters={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading stories…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="text-sm font-medium text-destructive">Failed to load stories</div>
            <div className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </div>
          </div>
        ) : (
          <StoriesTable
            stories={stories}
            onPreview={setPreviewStory}
            onPublish={setPublishStory}
          />
        )}
      </div>

      <PreviewSheet
        story={previewStory}
        onClose={() => setPreviewStory(null)}
        onPublish={(s) => {
          setPreviewStory(null);
          setPublishStory(s);
        }}
      />

      <PublishDialog story={publishStory} onClose={() => setPublishStory(null)} />
    </>
  );
}

function dateRangeFromFilter(date: Filters["date"]) {
  if (date === "all") return {};
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date === "week") {
    start.setDate(start.getDate() - 7);
  }
  return { date_from: start.toISOString() };
}
