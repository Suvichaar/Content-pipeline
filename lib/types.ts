export type StoryMode = "news" | "curious";
export type ImageSource = "ai" | "pexels" | "custom" | null;
export type VoiceEngine = "elevenlabs_pro" | "azure_basic";
export type Language = "hi" | "en";

export interface Slide {
  placeholder_id: string;
  text: string;
}

export interface Story {
  id: string;
  mode: StoryMode;
  template_key: string;
  category: string;
  input_language: Language;
  slide_count: number;
  image_source: ImageSource;
  voice_engine: VoiceEngine;
  title: string;
  slug: string;
  timestamp_id: string;
  description: string;
  keywords: string[];
  created_at: string;
  slides: Slide[];
}

export interface Filters {
  search: string;
  mode: "all" | StoryMode;
  category: string;
  date: "all" | "today" | "week";
}

export type PublishTargetKey = "suvichaar_live" | "webhook";
export type PublishStatus = "idle" | "sending" | "done";
export type PublishStateMap = Record<string, Partial<Record<PublishTargetKey, PublishStatus>>>;
