import { ApiError, apiFetch } from "@/lib/api/client";
import type { Engine } from "@/lib/api/client";
import type { CreateStoryFormValues } from "@/lib/validation";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CreateStoryInput extends CreateStoryFormValues {
  attachments?: File[];
  background_files?: File[];
}

export type StoryJobStatus = "pending" | "processing" | "completed" | "failed";

interface StoryJobAck {
  id: string;
  status: StoryJobStatus;
}

interface BackendSlide {
  placeholder_id: string;
  text?: string;
  image_url?: string;
}

interface BackendStoryResponse {
  id: string;
  mode: "news" | "curious";
  category: string;
  input_language?: string | null;
  slide_count: number;
  template_key: string;
  slide_deck: {
    template_key: string;
    language_code?: string | null;
    slides: BackendSlide[];
  };
  canurl?: string | null;
  canurl1?: string | null;
  created_at: string;
}

interface StoryJobStatusResponse {
  id: string;
  status: StoryJobStatus;
  error?: string | null;
  story?: BackendStoryResponse | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedStoryResult {
  id: string;
  mode: "news" | "curious";
  engine: Engine;
  template: string;
  category: string;
  slideCount: number;
  language: string;
  primaryUrl: string;
  htmlPath: string;
  createdAt: string;
  slides: { number: number; text: string; imageUrl?: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function serializeFiles(files?: File[]): Promise<string[]> {
  if (!files?.length) return [];
  return Promise.all(files.map((f) => readFileAsDataUrl(f)));
}

function mapBackgroundSource(value: CreateStoryInput["background_source"]) {
  return value === "default" ? null : value;
}

function splitKeywords(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

async function buildPayload(data: CreateStoryInput) {
  const includeImageRefs =
    data.background_source === "ai" || data.background_source === "custom";

  const [attachments, image_references] = await Promise.all([
    serializeFiles(data.attachments),
    serializeFiles(data.background_files),
  ]);

  return {
    mode: data.mode,
    template_key: data.template_key,
    slide_count: data.slide_count,
    category: data.category,
    user_input: data.user_input.trim(),
    notes: data.notes?.trim() || undefined,
    input_mode: "single",
    slide_inputs: [],
    prompt_keywords: splitKeywords(data.background_keywords),
    image_source: mapBackgroundSource(data.background_source),
    image_model: data.background_source === "ai" ? data.ai_image_model ?? "flux_2" : null,
    voice_engine: data.voice_engine,
    voice_id:
      data.voice_engine === "elevenlabs_pro" ? data.voice_id?.trim() || null : null,
    attachments,
    image_references: includeImageRefs ? image_references : [],
  };
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_WAIT_MS = 15 * 60 * 1000;

async function pollJob(engine: Engine, jobId: string): Promise<BackendStoryResponse> {
  const startedAt = Date.now();

  while (true) {
    if (Date.now() - startedAt > POLL_MAX_WAIT_MS) {
      throw new Error(
        "Story generation timed out after 15 minutes. The job may still be running on the server."
      );
    }

    try {
      const job = await apiFetch<StoryJobStatusResponse>(engine, `/stories/${jobId}/status`, {
        cache: "no-store" as RequestCache,
      });
      if (job.status === "completed" && job.story) return job.story;
      if (job.status === "failed") {
        throw new Error(job.error || "Story generation failed.");
      }
    } catch (err) {
      // Job may not be registered yet on a freshly spun-up worker — wait briefly.
      if (err instanceof ApiError && err.status === 404 && Date.now() - startedAt < 8000) {
        // fall through to sleep
      } else {
        throw err;
      }
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

function normalize(
  resp: BackendStoryResponse,
  engine: Engine
): GeneratedStoryResult {
  const primaryUrl = resp.canurl || resp.canurl1 || "";
  return {
    id: resp.id,
    mode: resp.mode,
    engine,
    template: resp.template_key,
    category: resp.category,
    slideCount: resp.slide_count,
    language: resp.input_language || resp.slide_deck.language_code || "unknown",
    primaryUrl,
    htmlPath: `/stories/${resp.id}/html`,
    createdAt: resp.created_at,
    slides: (resp.slide_deck.slides || []).map((s, i) => ({
      number: i + 1,
      text: s.text || "",
      imageUrl: s.image_url,
    })),
  };
}

// ── Public ───────────────────────────────────────────────────────────────────

export async function createStory(data: CreateStoryInput): Promise<GeneratedStoryResult> {
  const engine: Engine = data.mode === "curious" ? "curious" : "news";
  const payload = await buildPayload(data);
  const ack = await apiFetch<StoryJobAck>(engine, "/stories", {
    method: "POST",
    body: payload,
  });
  const story = await pollJob(engine, ack.id);
  return normalize(story, engine);
}
