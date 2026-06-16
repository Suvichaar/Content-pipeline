import type { Engine } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/client";

export type SubscriberStatus = "active" | "inactive" | "cancelled";
export type SubscriberSource =
  | "manual"
  | "bulk_csv"
  | "razorpay"
  | "labs_subscribe"
  | "api";

export interface SubscriberItem {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  tags: string[];
  subscription: Record<string, unknown>;
  extra: Record<string, unknown>;
  status: SubscriberStatus;
  source: SubscriberSource;
  created_at: string;
  updated_at: string;
}

export interface SubscriberListResponse {
  items: SubscriberItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SubscriberFilters {
  q?: string;
  tag?: string;
  status?: SubscriberStatus;
  limit?: number;
  offset?: number;
}

export interface SubscriberCreatePayload {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  tags?: string[];
  subscription?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  status?: SubscriberStatus;
}

export interface SubscriberBulkCreateResponse {
  created: SubscriberItem[];
  errors: Array<{ row?: number; error: string } & Record<string, unknown>>;
  requested: number;
  succeeded: number;
  failed: number;
}

export interface SubscriberTagItem {
  tag: string;
  count: number;
}

export interface SubscriberTagsResponse {
  items: SubscriberTagItem[];
}

const ENGINE: Engine = "news";

function buildQuery(filters: SubscriberFilters | undefined): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listSubscribers(filters?: SubscriberFilters): Promise<SubscriberListResponse> {
  return apiFetch<SubscriberListResponse>(ENGINE, `/subscribers${buildQuery(filters)}`);
}

export function listSubscriberTags(): Promise<SubscriberTagsResponse> {
  return apiFetch<SubscriberTagsResponse>(ENGINE, `/subscribers/tags`);
}

export function createSubscriber(payload: SubscriberCreatePayload): Promise<SubscriberItem> {
  return apiFetch<SubscriberItem>(ENGINE, `/subscribers`, { method: "POST", body: payload });
}

export function updateSubscriber(
  id: string,
  payload: Partial<SubscriberCreatePayload>
): Promise<SubscriberItem> {
  return apiFetch<SubscriberItem>(ENGINE, `/subscribers/${id}`, { method: "PUT", body: payload });
}

export function deleteSubscriber(id: string): Promise<void> {
  return apiFetch<void>(ENGINE, `/subscribers/${id}`, { method: "DELETE" });
}

export function bulkCreateSubscribers(items: SubscriberCreatePayload[]): Promise<SubscriberBulkCreateResponse> {
  return apiFetch<SubscriberBulkCreateResponse>(ENGINE, `/subscribers/bulk`, {
    method: "POST",
    body: { items },
  });
}
