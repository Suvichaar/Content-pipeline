import type { Engine } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/client";

export type BroadcastChannel = "whatsapp" | "email";
export type BroadcastStatus = "queued" | "partial" | "sent" | "failed";
export type DeliveryStatus = "sent" | "failed" | "queued";

export interface BroadcastRecipient {
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  tags?: string[];
}

export interface BroadcastRequest {
  channels: BroadcastChannel[];
  recipients: BroadcastRecipient[];
  audience_tag?: string | null;
  message?: string | null;
}

export interface BroadcastOutcome {
  channel: BroadcastChannel;
  recipient: string;
  status: DeliveryStatus;
  error?: string | null;
}

export interface BroadcastHistoryItem {
  id: string;
  story_id: string;
  channels: BroadcastChannel[];
  status: BroadcastStatus;
  audience_tag: string | null;
  message: string | null;
  total_count: number;
  sent_count: number;
  failed_count: number;
  triggered_by: string;
  created_at: string;
  updated_at: string;
  outcomes: BroadcastOutcome[];
}

export interface BroadcastHistoryResponse {
  items: BroadcastHistoryItem[];
}

export function broadcastStory(
  engine: Engine,
  storyId: string,
  payload: BroadcastRequest
): Promise<BroadcastHistoryItem> {
  return apiFetch<BroadcastHistoryItem>(engine, `/stories/${storyId}/broadcast`, {
    method: "POST",
    body: payload,
  });
}

export function listBroadcasts(
  engine: Engine,
  storyId: string
): Promise<BroadcastHistoryResponse> {
  return apiFetch<BroadcastHistoryResponse>(engine, `/stories/${storyId}/broadcasts`);
}
