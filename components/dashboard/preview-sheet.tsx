"use client";

import { ExternalLink, Megaphone, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODE_LABELS, templateLabel } from "@/lib/labels";
import type { UnifiedStory } from "@/lib/api/stories";

interface Props {
  story: UnifiedStory | null;
  onClose: () => void;
  onPublish: (story: UnifiedStory) => void;
  onBroadcast: (story: UnifiedStory) => void;
}

function PipelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function PreviewSheet({ story, onClose, onPublish, onBroadcast }: Props) {
  const open = !!story;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md md:max-w-lg">
        {story && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4 pr-12">
              <SheetTitle className="text-balance pr-2 text-base leading-snug">
                {story.title ?? "Untitled story"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {story.engine === "news" ? "News engine" : "Curious engine"} · ID {story.id.slice(0, 8)}…
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6 py-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={story.mode === "news" ? "news" : "curious"}>
                  {MODE_LABELS[story.mode]}
                </Badge>
                {story.category && <Badge variant="category">{story.category}</Badge>}
                <Badge variant="muted">{story.slide_count} slides</Badge>
                {story.input_language && (
                  <Badge variant="muted">
                    {story.input_language === "hi" ? "Hindi" : story.input_language === "en" ? "English" : story.input_language}
                  </Badge>
                )}
              </div>

              <div className="mt-5 rounded-lg border border-border bg-muted/20 px-4 py-1">
                <PipelineRow label="Engine" value={story.engine === "news" ? "News service" : "Curious service"} />
                <Separator />
                <PipelineRow label="Template" value={templateLabel(story.template_key)} />
                <Separator />
                <PipelineRow
                  label="Created"
                  value={new Date(story.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                />
                {story.canurl && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between gap-4 py-2 text-sm">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Live URL</span>
                      <a
                        href={story.canurl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[220px] truncate text-xs text-foreground underline-offset-2 hover:underline"
                      >
                        {story.canurl.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </>
                )}
              </div>

              <p className="mt-5 text-xs text-muted-foreground">
                Slide content lives in the engine. Open the live URL to see the rendered story or use Publish to push it to a target.
              </p>
            </ScrollArea>

            <div className="flex gap-2 border-t border-border bg-card px-6 py-4">
              {story.canurl && (
                <Button variant="outline" className="flex-1" asChild>
                  <a href={story.canurl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open live
                  </a>
                </Button>
              )}
              <Button className="flex-1" onClick={() => onPublish(story)}>
                <Send className="h-4 w-4" />
                Publish
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onBroadcast(story)}>
                <Megaphone className="h-4 w-4" />
                Broadcast
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
