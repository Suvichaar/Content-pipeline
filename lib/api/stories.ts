import type { Engine } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/client";

// ── Types (mirror backend Pydantic schemas) ─────────────────────────────────

export interface StoryListItem {
  id: string;
  title: string | null;
  mode: "news" | "curious";
  category: string | null;
  input_language: string | null;
  slide_count: number;
  template_key: string;
  canurl: string | null;
  created_at: string;
}

export interface StoryListResponse {
  items: StoryListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface StoryFilters {
  mode?: "news" | "curious";
  category?: string;
  q?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface PublishHistoryItem {
  id: string;
  story_id: string;
  target: "suvichaar_live" | "webhook";
  status: "success" | "failed" | "pending";
  webhook_url: string | null;
  error: string | null;
  published_by: string;
  published_at: string;
}

export interface PublishRequest {
  target: "suvichaar_live" | "webhook";
  webhook_url?: string;
}

// ── API calls ───────────────────────────────────────────────────────────────

function buildQuery(filters: StoryFilters | undefined): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listStories(engine: Engine, filters?: StoryFilters): Promise<StoryListResponse> {
  return apiFetch<StoryListResponse>(engine, `/stories${buildQuery(filters)}`);
}

export function publishStory(
  engine: Engine,
  storyId: string,
  payload: PublishRequest
): Promise<PublishHistoryItem> {
  return apiFetch<PublishHistoryItem>(engine, `/stories/${storyId}/publish`, {
    method: "POST",
    body: payload,
  });
}

export function listPublishes(
  engine: Engine,
  storyId: string
): Promise<{ items: PublishHistoryItem[] }> {
  return apiFetch<{ items: PublishHistoryItem[] }>(engine, `/stories/${storyId}/publishes`);
}

// ── Cross-engine helpers ────────────────────────────────────────────────────

export interface UnifiedStory extends StoryListItem {
  engine: Engine;
}

function engineForMode(mode: "news" | "curious"): Engine {
  return mode === "curious" ? "curious" : "news";
}

/**
 * Fetch from both backends in parallel and merge into a single list.
 *
 * Both engines may share the same underlying database (production Azure
 * Postgres). To avoid duplicates we always dedupe by story id and infer
 * `engine` from the story's own `mode` — publish/preview is then routed
 * to the matching backend regardless of which engine returned the row.
 */
export async function listAllStories(filters?: StoryFilters): Promise<{
  items: UnifiedStory[];
  totals: { news: number; curious: number; combined: number };
  errors: { engine: Engine; error: string }[];
}> {
  const targets: Engine[] =
    filters?.mode === "news"
      ? ["news"]
      : filters?.mode === "curious"
        ? ["curious"]
        : ["news", "curious"];

  // Pass the full filters (including mode) through to each backend so the
  // SQL query narrows server-side. Both engines may share the same DB in
  // production, so mode needs to be applied at the backend, not stripped.
  const results = await Promise.allSettled(
    targets.map((engine) => listStories(engine, filters).then((r) => ({ engine, r })))
  );

  const seen = new Map<string, UnifiedStory>();
  const errors: { engine: Engine; error: string }[] = [];

  results.forEach((res, i) => {
    const sourceEngine = targets[i];
    if (res.status === "fulfilled") {
      res.value.r.items.forEach((it) => {
        if (seen.has(it.id)) return;
        seen.set(it.id, { ...it, engine: engineForMode(it.mode) });
      });
    } else {
      errors.push({
        engine: sourceEngine,
        error: res.reason instanceof Error ? res.reason.message : String(res.reason),
      });
    }
  });

  let items = Array.from(seen.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Client-side safety net: if a backend ignores the mode filter (e.g.
  // older version, or shared DB returning everything), still drop rows
  // that don't match the requested mode.
  if (filters?.mode === "news" || filters?.mode === "curious") {
    items = items.filter((it) => it.mode === filters.mode);
  }

  // Counts reflect what the user actually sees after dedupe. When the
  // engines share a DB (production), the per-engine totals from the
  // backend would double-count, so we derive everything from the merged
  // result instead.
  const totals = {
    news: items.filter((it) => it.mode === "news").length,
    curious: items.filter((it) => it.mode === "curious").length,
    combined: items.length,
  };

  return { items, totals, errors };
}
