"use client";

import { ExternalLink, Eye, Inbox, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MODE_LABELS, templateLabel } from "@/lib/labels";
import type { UnifiedStory } from "@/lib/api/stories";

interface Props {
  stories: UnifiedStory[];
  onPreview: (story: UnifiedStory) => void;
  onPublish: (story: UnifiedStory) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No stories match your filters</p>
      <p className="mt-1 text-xs text-muted-foreground">Try adjusting the search or reset filters.</p>
    </div>
  );
}

export function StoriesTable({ stories, onPreview, onPublish }: Props) {
  if (stories.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState />
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Title</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Template</TableHead>
              <TableHead className="text-right">Slides</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stories.map((story) => (
              <TableRow key={`${story.engine}:${story.id}`} className="group">
                <TableCell className="max-w-[360px]">
                  <div className="truncate font-medium text-foreground" title={story.title ?? ""}>
                    {story.title ?? <span className="text-muted-foreground">Untitled</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={story.mode === "news" ? "news" : "curious"}>
                    {MODE_LABELS[story.mode]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {story.category ? (
                    <Badge variant="category">{story.category}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {templateLabel(story.template_key)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {story.slide_count}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(story.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => onPreview(story)}>
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onPublish(story)}>
                      <Send className="h-3.5 w-3.5" />
                      Publish
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {stories.map((story) => (
          <div
            key={`${story.engine}:${story.id}`}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="text-sm font-medium text-foreground">
              {story.title ?? <span className="text-muted-foreground">Untitled</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={story.mode === "news" ? "news" : "curious"}>
                {MODE_LABELS[story.mode]}
              </Badge>
              {story.category && <Badge variant="category">{story.category}</Badge>}
              <span className="text-muted-foreground">{story.slide_count} slides</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {new Date(story.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => onPreview(story)}>
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onPublish(story)}>
                <ExternalLink className="h-3.5 w-3.5" />
                Publish
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
