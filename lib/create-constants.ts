import type { StoryMode } from "@/lib/types";

export interface TemplateOption {
  id: string;
  name: string;
  mode: StoryMode;
}

export const TEMPLATES: TemplateOption[] = [
  { id: "test-news-1", name: "Standard News", mode: "news" },
  { id: "test-news-2", name: "Feature News", mode: "news" },
  { id: "test-news-3", name: "Breaking News", mode: "news" },
  { id: "test-news-3v1", name: "Breaking News (v1)", mode: "news" },
  { id: "test-news-org", name: "Org Branding", mode: "news" },
  { id: "template-v19", name: "Legacy v19", mode: "news" },
  { id: "curious-template-1", name: "Curious Default", mode: "curious" },
];

export const CATEGORIES_BY_MODE: Record<StoryMode, string[]> = {
  news: ["News", "Technology", "Sports", "Business", "World", "Politics", "Entertainment"],
  curious: ["Education", "History", "Culture", "Wildlife", "Science", "Lifestyle"],
};

export const SLIDE_LIMITS: Record<StoryMode, { min: number; max: number; default: number }> = {
  news: { min: 4, max: 10, default: 4 },
  curious: { min: 4, max: 10, default: 8 },
};

export const VOICE_ENGINES = [
  { id: "azure_basic", name: "Azure Basic", desc: "Default Azure TTS voice" },
  { id: "elevenlabs_pro", name: "ElevenLabs Pro", desc: "Higher quality, voice ID required" },
] as const;

export type VoiceEngineId = (typeof VOICE_ENGINES)[number]["id"];

export const BACKGROUND_SOURCES = [
  { id: "default", name: "Default", desc: "Use the engine's default backgrounds" },
  { id: "ai", name: "AI Generated", desc: "Generate images with DALL·E / Flux" },
  { id: "pexels", name: "Pexels Stock", desc: "Search Pexels for matching photos" },
  { id: "custom", name: "Custom Upload", desc: "Upload your own background images" },
] as const;

export type BackgroundSourceId = (typeof BACKGROUND_SOURCES)[number]["id"];

export const AI_IMAGE_MODELS = [
  { id: "flux_2", name: "Flux 2" },
  { id: "mai_2", name: "MAI 2" },
  { id: "gpt_image_15", name: "GPT-Image 1.5" },
] as const;

export type AIImageModelId = (typeof AI_IMAGE_MODELS)[number]["id"];

export const SINGLE_INPUT_MAX = 5000;

export const ATTACHMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const BACKGROUND_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function templatesForMode(mode: StoryMode): TemplateOption[] {
  return TEMPLATES.filter((t) => t.mode === mode);
}

export function defaultTemplateFor(mode: StoryMode): string {
  return templatesForMode(mode)[0]?.id ?? "test-news-1";
}

export function defaultCategoryFor(mode: StoryMode): string {
  return CATEGORIES_BY_MODE[mode][0];
}
