"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ImageIcon, Plus, Save, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createStoryboard,
  slugify,
  type StoryboardCreatePayload,
  type StoryboardMediaItem,
  type StoryboardMediaType,
  type StoryboardStatus,
} from "@/lib/api/storyboard";

interface Props {
  onSaved: () => void;
}

interface FormState {
  title: string;
  slug: string;
  slugTouched: boolean;
  category: string;
  language: string;
  mode: "news" | "curious" | "none";
  status: StoryboardStatus;
  cover_url: string;
  tags: string[];
  tagInput: string;
  media: StoryboardMediaItem[];
  notes: string;
  external_id: string;
}

const INITIAL: FormState = {
  title: "",
  slug: "",
  slugTouched: false,
  category: "",
  language: "",
  mode: "news",
  status: "draft",
  cover_url: "",
  tags: [],
  tagInput: "",
  media: [],
  notes: "",
  external_id: "",
};

export function StoryboardForm({ onSaved }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (payload: StoryboardCreatePayload) => createStoryboard(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["storyboard"] });
      setForm(INITIAL);
      setErrorMsg(null);
      onSaved();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : "Failed to save"),
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slugTouched ? prev.slug : slugify(value),
    }));
  }

  function addTag() {
    const t = form.tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, t], tagInput: "" }));
  }

  function addMedia() {
    setForm((prev) => ({
      ...prev,
      media: [...prev.media, { url: "", type: "image", alt: "", caption: "" }],
    }));
  }

  function updateMedia(idx: number, patch: Partial<StoryboardMediaItem>) {
    setForm((prev) => ({
      ...prev,
      media: prev.media.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));
  }

  function removeMedia(idx: number) {
    setForm((prev) => ({ ...prev, media: prev.media.filter((_, i) => i !== idx) }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      setErrorMsg("Title and slug are required.");
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(form.slug)) {
      setErrorMsg("Slug must be lowercase alphanumerics and hyphens only.");
      return;
    }
    const payload: StoryboardCreatePayload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      category: form.category.trim() || null,
      language: form.language.trim() || null,
      mode: form.mode === "none" ? null : form.mode,
      status: form.status,
      cover_url: form.cover_url.trim() || null,
      tags: form.tags,
      media_urls: form.media.filter((m) => m.url.trim()),
      notes: form.notes.trim() || null,
      external_id: form.external_id.trim() || null,
    };
    mut.mutate(payload);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-border bg-card p-5">
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Trump-Iran oil deal recap"
            required
          />
        </Field>
        <Field label="Slug" required hint="Auto-derived from title; lowercase + hyphens.">
          <Input
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value, slugTouched: true }))}
            placeholder="trump-iran-oil-deal-recap"
            required
          />
        </Field>
        <Field label="Category">
          <Input
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="News"
          />
        </Field>
        <Field label="Language">
          <Input
            value={form.language}
            onChange={(e) => update("language", e.target.value)}
            placeholder="en, hi"
          />
        </Field>
        <Field label="Mode">
          <Select value={form.mode} onValueChange={(v) => update("mode", v as FormState["mode"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="curious">Curious</SelectItem>
              <SelectItem value="none">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => update("status", v as StoryboardStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Cover URL (CDN)" hint="Direct CDN link. Preview shown when set.">
        <Input
          value={form.cover_url}
          onChange={(e) => update("cover_url", e.target.value)}
          placeholder="https://media.suvichaar.org/…/cover.jpg"
        />
        {form.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.cover_url}
            alt=""
            className="mt-2 h-32 w-full max-w-md rounded-lg object-cover ring-1 ring-border"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="mt-2 flex h-32 w-full max-w-md items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            <ImageIcon className="mr-2 h-4 w-4" /> Cover preview
          </div>
        )}
      </Field>

      <Field label="Tags" hint="Press Enter or click Add to attach a tag.">
        <div className="flex gap-2">
          <Input
            value={form.tagInput}
            onChange={(e) => update("tagInput", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="politics"
          />
          <Button type="button" variant="secondary" onClick={addTag}>
            Add
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {form.tags.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                {t}
                <button
                  type="button"
                  onClick={() => update("tags", form.tags.filter((x) => x !== t))}
                  className="rounded hover:bg-foreground/10"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Field>

      <Field label="Media URLs" hint="Additional CDN assets (images, video, audio).">
        <div className="space-y-2">
          {form.media.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Select
                value={m.type}
                onValueChange={(v) => updateMedia(i, { type: v as StoryboardMediaType })}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="col-span-6"
                placeholder="https://media.suvichaar.org/…"
                value={m.url}
                onChange={(e) => updateMedia(i, { url: e.target.value })}
              />
              <Input
                className="col-span-3"
                placeholder="Alt text"
                value={m.alt ?? ""}
                onChange={(e) => updateMedia(i, { alt: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="col-span-1"
                onClick={() => removeMedia(i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addMedia}>
            <Plus className="h-4 w-4" /> Add media
          </Button>
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="External ID" hint="Optional — Strapi ID or external reference.">
          <Input
            value={form.external_id}
            onChange={(e) => update("external_id", e.target.value)}
            placeholder="strapi:42"
          />
        </Field>
        <Field label="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={() => setForm(INITIAL)}>
          Reset
        </Button>
        <Button type="submit" disabled={mut.isPending}>
          <Save className="h-4 w-4" />
          {mut.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
