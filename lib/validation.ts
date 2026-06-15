import { z } from "zod";
import { SLIDE_LIMITS } from "@/lib/create-constants";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const createStorySchema = z
  .object({
    mode: z.enum(["news", "curious"]),
    template_key: z.string().min(1, "Template is required"),
    category: z.string().min(1, "Category is required"),
    slide_count: z.number().int().min(4).max(10),
    voice_engine: z.enum(["azure_basic", "elevenlabs_pro"]),
    voice_id: z.string().optional(),
    user_input: z.string().min(1, "Please provide a URL or paste some content"),
    notes: z.string().optional(),
    background_source: z.enum(["default", "ai", "pexels", "custom"]),
    ai_image_model: z.enum(["flux_2", "mai_2", "gpt_image_15"]).optional(),
    background_keywords: z.string().optional(),
  })
  .refine(
    (data) => {
      const limits = SLIDE_LIMITS[data.mode];
      return data.slide_count >= limits.min && data.slide_count <= limits.max;
    },
    {
      message: "Slide count is outside the allowed range for this mode",
      path: ["slide_count"],
    }
  )
  .refine(
    (data) => {
      if (data.voice_engine === "elevenlabs_pro") {
        return !!data.voice_id && data.voice_id.trim().length > 0;
      }
      return true;
    },
    {
      message: "Voice ID is required for ElevenLabs Pro",
      path: ["voice_id"],
    }
  );

export type CreateStoryFormValues = z.infer<typeof createStorySchema>;
