"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Mail, MessageCircle, Megaphone, Tag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  broadcastStory,
  type BroadcastChannel,
  type BroadcastHistoryItem,
  type BroadcastRecipient,
} from "@/lib/api/broadcast";
import { listSubscriberTags } from "@/lib/api/subscribers";
import type { UnifiedStory } from "@/lib/api/stories";
import { cn } from "@/lib/utils";

interface Props {
  story: UnifiedStory | null;
  onClose: () => void;
}

const CHANNELS: { key: BroadcastChannel; label: string; icon: typeof Mail; hint: string }[] = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, hint: "Needs phone column" },
  { key: "email", label: "Email", icon: Mail, hint: "Needs email column" },
];

type Audience = "tag" | "adhoc";

export function BroadcastDialog({ story, onClose }: Props) {
  const open = !!story;
  const [channels, setChannels] = useState<Set<BroadcastChannel>>(new Set(["whatsapp"]));
  const [audience, setAudience] = useState<Audience>("tag");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [recipientsText, setRecipientsText] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<BroadcastHistoryItem | null>(null);

  const { data: tagsData } = useQuery({
    queryKey: ["subscriber-tags"],
    queryFn: () => listSubscriberTags(),
    enabled: open,
  });

  const parsed = useMemo(() => parseRecipients(recipientsText), [recipientsText]);

  const selectedTagCount = useMemo(() => {
    if (!selectedTag) return 0;
    return tagsData?.items.find((t) => t.tag === selectedTag)?.count ?? 0;
  }, [tagsData, selectedTag]);

  const mut = useMutation({
    mutationFn: () => {
      if (!story) throw new Error("No story selected");
      return broadcastStory(story.engine, story.id, {
        channels: Array.from(channels),
        recipients: audience === "adhoc" ? parsed.recipients : [],
        audience_tag: audience === "tag" ? selectedTag || null : null,
        message: message.trim() || null,
      });
    },
    onSuccess: (res) => {
      setResult(res);
      toast.success("Broadcast triggered", {
        description: `${res.sent_count} sent · ${res.failed_count} failed · ${
          res.total_count - res.sent_count - res.failed_count
        } queued`,
      });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Broadcast failed";
      toast.error("Broadcast failed", { description: msg });
    },
  });

  function toggleChannel(c: BroadcastChannel) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function handleClose(next: boolean) {
    if (!next) {
      onClose();
      setChannels(new Set(["whatsapp"]));
      setAudience("tag");
      setSelectedTag("");
      setRecipientsText("");
      setMessage("");
      setResult(null);
    }
  }

  const audienceReady =
    audience === "adhoc"
      ? parsed.recipients.length > 0
      : Boolean(selectedTag) && selectedTagCount > 0;
  const canSend = channels.size > 0 && audienceReady && !mut.isPending && !result;
  const audienceLabel =
    audience === "adhoc"
      ? `${parsed.recipients.length}`
      : `${selectedTagCount} subscriber${selectedTagCount === 1 ? "" : "s"}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        {story && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-foreground" />
                <DialogTitle>Broadcast story</DialogTitle>
              </div>
              <DialogDescription className="line-clamp-2">
                {story.title ?? "Untitled"}
              </DialogDescription>
            </DialogHeader>

            {result ? (
              <ResultView result={result} onClose={() => handleClose(false)} />
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Channels</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {CHANNELS.map((c) => {
                      const active = channels.has(c.key);
                      const Icon = c.icon;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => toggleChannel(c.key)}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                            active
                              ? "border-foreground bg-secondary"
                              : "border-border bg-card hover:bg-secondary/40"
                          )}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Icon className="h-4 w-4" />
                            {c.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{c.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Audience</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAudience("tag")}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                        audience === "tag"
                          ? "border-foreground bg-secondary"
                          : "border-border bg-card hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Tag className="h-4 w-4" />
                        Subscriber tag
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Pull from /subscribers
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudience("adhoc")}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                        audience === "adhoc"
                          ? "border-foreground bg-secondary"
                          : "border-border bg-card hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-4 w-4" />
                        Ad-hoc list
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Paste phone / email lines
                      </div>
                    </button>
                  </div>
                </div>

                {audience === "tag" ? (
                  <div>
                    <Label className="text-xs">Tag</Label>
                    <Select value={selectedTag} onValueChange={setSelectedTag}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pick a tag…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tagsData?.items ?? []).length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No tags yet — add subscribers first
                          </SelectItem>
                        ) : (
                          (tagsData?.items ?? []).map((t) => (
                            <SelectItem key={t.tag} value={t.tag}>
                              {t.tag}{" "}
                              <span className="text-muted-foreground">({t.count})</span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedTag && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Will broadcast to {selectedTagCount} active subscriber
                        {selectedTagCount === 1 ? "" : "s"} carrying <b>{selectedTag}</b>.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs">Recipients</Label>
                    <Textarea
                      value={recipientsText}
                      onChange={(e) => setRecipientsText(e.target.value)}
                      placeholder={`One per line, e.g.\n+919876543210\nuser@example.com\n+919812345678,user2@example.com,User Two`}
                      rows={6}
                      className="mt-1 font-mono text-xs"
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="secondary">
                        {parsed.recipients.length} recipient
                        {parsed.recipients.length === 1 ? "" : "s"}
                      </Badge>
                      {parsed.recipients.length > 0 && (
                        <span>
                          {parsed.recipients.filter((r) => r.phone).length} with phone ·{" "}
                          {parsed.recipients.filter((r) => r.email).length} with email
                        </span>
                      )}
                      {parsed.skipped > 0 && (
                        <span className="text-destructive">
                          {parsed.skipped} invalid line(s) skipped
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Message (optional)</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Short message that goes with the story link"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                  <Button variant="ghost" onClick={() => handleClose(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => mut.mutate()} disabled={!canSend}>
                    {mut.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>Send to {audienceLabel}</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultView({
  result,
  onClose,
}: {
  result: BroadcastHistoryItem;
  onClose: () => void;
}) {
  const queued = result.total_count - result.sent_count - result.failed_count;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        <span className="font-medium">Broadcast recorded</span>
        <Badge variant="secondary" className="capitalize">
          {result.status}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Sent" value={result.sent_count} tone="emerald" />
        <Stat label="Queued" value={queued} />
        <Stat label="Failed" value={result.failed_count} tone={result.failed_count > 0 ? "red" : undefined} />
      </div>
      {result.outcomes.some((o) => o.status === "failed" || o.status === "queued") && (
        <div className="max-h-40 overflow-auto rounded-lg border border-border p-2 text-xs">
          {result.outcomes
            .filter((o) => o.status !== "sent")
            .map((o, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-0.5">
                <span className="truncate">
                  <span className="capitalize">{o.channel}</span> · {o.recipient}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    o.status === "failed" ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {o.status}
                  {o.error ? ` · ${o.error}` : ""}
                </span>
              </div>
            ))}
        </div>
      )}
      <div className="flex justify-end pt-2">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "red" }) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "red"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border p-2">
      <div className={`text-xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

// ── Recipient parser ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const PHONE_RE = /^\+?[0-9][0-9\-\s]{6,}$/;

interface ParseResult {
  recipients: BroadcastRecipient[];
  skipped: number;
}

function parseRecipients(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const recipients: BroadcastRecipient[] = [];
  let skipped = 0;
  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
    const rec: BroadcastRecipient = {};
    for (const part of parts) {
      if (!rec.email && EMAIL_RE.test(part)) {
        rec.email = part;
      } else if (!rec.phone && PHONE_RE.test(part.replace(/[\s-]/g, ""))) {
        rec.phone = part.replace(/[\s-]/g, "");
      } else if (!rec.name) {
        rec.name = part;
      }
    }
    if (!rec.phone && !rec.email) {
      skipped++;
      continue;
    }
    recipients.push(rec);
  }
  return { recipients, skipped };
}
