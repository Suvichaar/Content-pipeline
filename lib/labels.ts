import type { Story, StoryMode } from "./types";

export const MODE_LABELS: Record<StoryMode, string> = {
  news: "News",
  curious: "Curious",
};

export const IMG_SRC_LABELS: Record<string, string> = {
  ai: "AI Generated",
  pexels: "Pexels Stock",
  custom: "Custom Upload",
};

export const VOICE_LABELS: Record<string, string> = {
  elevenlabs_pro: "ElevenLabs Pro",
  azure_basic: "Azure Basic",
};

const TEMPLATE_MAP: Record<string, string> = {
  "test-news-1": "News Default",
  "test-news-2": "News Alternate",
  "test-news-3": "Breaking News",
  "test-news-3v1": "Breaking v1",
  "test-news-org": "Org Branding",
  "template-v19": "Legacy v19",
  "curious-template-1": "Curious Default",
};

export function templateLabel(key: string): string {
  return TEMPLATE_MAP[key] ?? key;
}

export function storyUrl(story: Pick<Story, "slug" | "timestamp_id">): string {
  return `https://suvichaar.org/stories/${story.slug}_${story.timestamp_id}`;
}

export const CATEGORIES = [
  "News",
  "Technology",
  "Sports",
  "Business",
  "World",
  "Science",
  "History",
  "Culture",
] as const;
