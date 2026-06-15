"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Segmented } from "@/components/create/segmented";
import { FileUpload } from "@/components/create/file-upload";
import { GenerationProgress } from "@/components/create/generation-progress";
import { ResultCard } from "@/components/create/result-card";

import { useCreateStory } from "@/hooks/use-create-story";
import {
  AI_IMAGE_MODELS,
  ATTACHMENT_TYPES,
  BACKGROUND_SOURCES,
  BACKGROUND_TYPES,
  CATEGORIES_BY_MODE,
  SINGLE_INPUT_MAX,
  SLIDE_LIMITS,
  TEMPLATES,
  VOICE_ENGINES,
  defaultCategoryFor,
  defaultTemplateFor,
  templatesForMode,
} from "@/lib/create-constants";
import { createStorySchema, type CreateStoryFormValues } from "@/lib/validation";
import type { StoryMode } from "@/lib/types";

export function CreateForm() {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [backgroundFiles, setBackgroundFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateStoryFormValues>({
    resolver: zodResolver(createStorySchema),
    defaultValues: {
      mode: "news",
      template_key: defaultTemplateFor("news"),
      category: defaultCategoryFor("news"),
      slide_count: SLIDE_LIMITS.news.default,
      voice_engine: "azure_basic",
      voice_id: "",
      user_input: "",
      notes: "",
      background_source: "default",
      ai_image_model: "flux_2",
      background_keywords: "",
    },
  });

  const create = useCreateStory();

  const mode = watch("mode");
  const voiceEngine = watch("voice_engine");
  const backgroundSource = watch("background_source");
  const userInput = watch("user_input") ?? "";

  const handleModeChange = (next: StoryMode) => {
    setValue("mode", next, { shouldValidate: true });

    const templates = templatesForMode(next).map((t) => t.id);
    const currentTemplate = watch("template_key");
    if (!templates.includes(currentTemplate)) {
      setValue("template_key", defaultTemplateFor(next));
    }

    const cats = CATEGORIES_BY_MODE[next];
    const currentCat = watch("category");
    if (!cats.includes(currentCat)) {
      setValue("category", defaultCategoryFor(next));
    }

    const limits = SLIDE_LIMITS[next];
    const currentCount = watch("slide_count");
    if (currentCount < limits.min || currentCount > limits.max) {
      setValue("slide_count", limits.default);
    }
  };

  const onSubmit = async (values: CreateStoryFormValues) => {
    try {
      const result = await create.mutateAsync({
        ...values,
        attachments,
        background_files: backgroundFiles,
      });
      toast.success("Story generated", { description: `${result.slideCount} slides ready.` });
    } catch (err) {
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleCreateAnother = () => {
    setAttachments([]);
    setBackgroundFiles([]);
    create.reset();
    reset();
  };

  if (create.data) {
    return (
      <div className="space-y-5">
        <ResultCard story={create.data} onCreateAnother={handleCreateAnother} />
      </div>
    );
  }

  const limits = SLIDE_LIMITS[mode];
  const templates = templatesForMode(mode);
  const categories = CATEGORIES_BY_MODE[mode];

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Mode + Story configuration ─────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Story setup</h2>
              <p className="text-xs text-muted-foreground">Pick the engine and shape.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Segmented
                value={mode}
                onChange={handleModeChange}
                ariaLabel="Story mode"
                options={[
                  { value: "news", label: "News", hint: "Factual · 4–10 slides" },
                  { value: "curious", label: "Curious", hint: "Educational · 4–10 slides" },
                ]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template_key">Template</Label>
                <Select
                  value={watch("template_key")}
                  onValueChange={(v) => setValue("template_key", v, { shouldValidate: true })}
                >
                  <SelectTrigger id="template_key">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.template_key && <ErrorMsg msg={errors.template_key.message} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={watch("category")}
                  onValueChange={(v) => setValue("category", v, { shouldValidate: true })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <ErrorMsg msg={errors.category.message} />}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slide_count">Slide count</Label>
                <Input
                  id="slide_count"
                  type="number"
                  min={limits.min}
                  max={limits.max}
                  step={1}
                  {...register("slide_count", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Range: {limits.min}–{limits.max} slides
                </p>
                {errors.slide_count && <ErrorMsg msg={errors.slide_count.message} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice_engine">Voice engine</Label>
                <Select
                  value={voiceEngine}
                  onValueChange={(v) =>
                    setValue("voice_engine", v as CreateStoryFormValues["voice_engine"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="voice_engine">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_ENGINES.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {voiceEngine === "elevenlabs_pro" && (
              <div className="space-y-2">
                <Label htmlFor="voice_id">ElevenLabs voice ID</Label>
                <Input
                  id="voice_id"
                  placeholder="e.g. yD0Zg2jxgfQLY8I2MEHO"
                  {...register("voice_id")}
                />
                {errors.voice_id && <ErrorMsg msg={errors.voice_id.message} />}
              </div>
            )}
          </div>
        </section>

        {/* ── Content ────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight">Content</h2>
            <p className="text-xs text-muted-foreground">
              Paste a URL, article text, or describe what you want.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="user_input">URL or text</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {userInput.length}/{SINGLE_INPUT_MAX}
                </span>
              </div>
              <Textarea
                id="user_input"
                rows={6}
                maxLength={SINGLE_INPUT_MAX}
                placeholder="https://example.com/article  OR  paste article text here…"
                {...register("user_input")}
              />
              {errors.user_input && <ErrorMsg msg={errors.user_input.message} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="e.g. Make it in Hindi · Keep it factual · Add a question to the cover"
                {...register("notes")}
              />
            </div>

            <FileUpload
              label="Attach reference files (optional)"
              hint="PDF, DOCX, JPG, PNG, WebP"
              accept={ATTACHMENT_TYPES}
              files={attachments}
              onChange={setAttachments}
            />
          </div>
        </section>

        {/* ── Background images ─────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight">Background images</h2>
            <p className="text-xs text-muted-foreground">Pick where slide backgrounds come from.</p>
          </div>

          <div className="space-y-4">
            <Segmented
              value={backgroundSource}
              onChange={(v) =>
                setValue("background_source", v as CreateStoryFormValues["background_source"], {
                  shouldValidate: true,
                })
              }
              ariaLabel="Background source"
              options={BACKGROUND_SOURCES.map((s) => ({ value: s.id, label: s.name }))}
            />

            {backgroundSource === "ai" && (
              <div className="space-y-2">
                <Label htmlFor="ai_image_model">AI image model</Label>
                <Select
                  value={watch("ai_image_model") ?? "flux_2"}
                  onValueChange={(v) =>
                    setValue("ai_image_model", v as CreateStoryFormValues["ai_image_model"])
                  }
                >
                  <SelectTrigger id="ai_image_model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_IMAGE_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(backgroundSource === "ai" || backgroundSource === "pexels") && (
              <div className="space-y-2">
                <Label htmlFor="background_keywords">Keywords (optional)</Label>
                <Input
                  id="background_keywords"
                  placeholder="news, breaking, cricket"
                  {...register("background_keywords")}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated. Helps guide the image search or generation.
                </p>
              </div>
            )}

            {(backgroundSource === "ai" || backgroundSource === "custom") && (
              <FileUpload
                label={
                  backgroundSource === "custom"
                    ? "Upload background images"
                    : "Optional reference images for AI"
                }
                hint="JPG, PNG, WebP — used as visual reference"
                accept={BACKGROUND_TYPES}
                files={backgroundFiles}
                onChange={setBackgroundFiles}
              />
            )}
          </div>
        </section>

        {create.isError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-medium">Generation failed</div>
              <div className="text-xs">{create.error?.message ?? "Unknown error"}</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="submit" size="lg" disabled={create.isPending}>
            <Sparkles className="h-4 w-4" />
            {create.isPending ? "Generating…" : "Generate story"}
          </Button>
        </div>
      </form>

      {create.isPending && <GenerationProgress step={create.step} />}
    </div>
  );
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {msg}
    </p>
  );
}
