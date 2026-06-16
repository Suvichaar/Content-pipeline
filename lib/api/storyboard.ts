import type { Engine } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/client";

// ── Types (mirror backend Pydantic schemas) ─────────────────────────────────

export type StoryboardStatus = "draft" | "published" | "archived";
export type StoryboardSource = "manual" | "bulk_csv" | "strapi" | "api";
export type StoryboardMediaType = "image" | "video" | "audio";

export interface StoryboardMediaItem {
  url: string;
  type: StoryboardMediaType;
  alt?: string | null;
  caption?: string | null;
}

export interface StoryboardItem {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  tags: string[];
  cover_url: string | null;
  media_urls: StoryboardMediaItem[];
  language: string | null;
  mode: "news" | "curious" | null;
  status: StoryboardStatus;
  source: StoryboardSource;
  external_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StoryboardListResponse {
  items: StoryboardItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface StoryboardFilters {
  q?: string;
  category?: string;
  status?: StoryboardStatus;
  tag?: string;
  limit?: number;
  offset?: number;
}

export interface StoryboardCreatePayload {
  title: string;
  slug: string;
  category?: string | null;
  tags?: string[];
  cover_url?: string | null;
  media_urls?: StoryboardMediaItem[];
  language?: string | null;
  mode?: "news" | "curious" | null;
  status?: StoryboardStatus;
  external_id?: string | null;
  notes?: string | null;
}

export interface StoryboardBulkCreatePayload {
  items: StoryboardCreatePayload[];
}

export interface StoryboardBulkCreateResponse {
  created: StoryboardItem[];
  errors: Array<{ row?: number; error: string } & Record<string, unknown>>;
  requested: number;
  succeeded: number;
  failed: number;
}

// ── API calls — always against the News engine for now ─────────────────────

const ENGINE: Engine = "news";

function buildQuery(filters: StoryboardFilters | undefined): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listStoryboard(filters?: StoryboardFilters): Promise<StoryboardListResponse> {
  return apiFetch<StoryboardListResponse>(ENGINE, `/storyboard${buildQuery(filters)}`);
}

export function getStoryboard(id: string): Promise<StoryboardItem> {
  return apiFetch<StoryboardItem>(ENGINE, `/storyboard/${id}`);
}

export function createStoryboard(payload: StoryboardCreatePayload): Promise<StoryboardItem> {
  return apiFetch<StoryboardItem>(ENGINE, `/storyboard`, { method: "POST", body: payload });
}

export function updateStoryboard(
  id: string,
  payload: Partial<StoryboardCreatePayload>
): Promise<StoryboardItem> {
  return apiFetch<StoryboardItem>(ENGINE, `/storyboard/${id}`, { method: "PUT", body: payload });
}

export function deleteStoryboard(id: string): Promise<void> {
  return apiFetch<void>(ENGINE, `/storyboard/${id}`, { method: "DELETE" });
}

export function bulkCreateStoryboard(
  payload: StoryboardBulkCreatePayload
): Promise<StoryboardBulkCreateResponse> {
  return apiFetch<StoryboardBulkCreateResponse>(ENGINE, `/storyboard/bulk`, {
    method: "POST",
    body: payload,
  });
}

// ── Slug helper ─────────────────────────────────────────────────────────────

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
