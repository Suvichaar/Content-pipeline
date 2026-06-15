"use client";

import { Check, ExternalLink, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MODE_LABELS, templateLabel } from "@/lib/labels";
import type { GeneratedStoryResult } from "@/lib/api/create";

interface Props {
  story: GeneratedStoryResult;
  onCreateAnother: () => void;
}

export function ResultCard({ story, onCreateAnother }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Story generated successfully</div>
            <div className="text-xs text-muted-foreground">ID {story.id}</div>
          </div>
        </div>
        <Badge variant={story.mode === "news" ? "news" : "curious"}>{MODE_LABELS[story.mode]}</Badge>
      </div>

      <div className="px-6 py-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Template" value={templateLabel(story.template)} />
          <Row label="Category" value={story.category} />
          <Row label="Slides" value={String(story.slideCount)} />
          <Row label="Language" value={story.language} />
        </div>

        {story.slides.length > 0 && (
          <>
            <Separator className="my-5" />
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Slide preview</div>
              <span className="text-xs text-muted-foreground">{story.slides.length} slides</span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {story.slides.slice(0, 6).map((s) => (
                <div key={s.number} className="rounded-md border border-border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Slide {s.number}</div>
                  <p className="text-sm leading-relaxed">{s.text || <em className="text-muted-foreground">No text</em>}</p>
                </div>
              ))}
              {story.slides.length > 6 && (
                <p className="text-center text-xs text-muted-foreground">
                  + {story.slides.length - 6} more slides — open the live URL to view
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 border-t border-border bg-card px-6 py-4">
        {story.primaryUrl && (
          <Button variant="outline" className="flex-1" asChild>
            <a href={story.primaryUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open live story
            </a>
          </Button>
        )}
        <Button className="flex-1" onClick={onCreateAnother}>
          <Plus className="h-4 w-4" />
          Create another
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/30 px-3 py-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
