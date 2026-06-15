"use client";

import { useState } from "react";
import { Check, Globe, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePublishMutation } from "@/hooks/use-stories";
import { ApiError } from "@/lib/api/client";
import type { UnifiedStory } from "@/lib/api/stories";

interface Props {
  story: UnifiedStory | null;
  onClose: () => void;
}

type Target = "suvichaar_live" | "webhook";
type TargetState = "idle" | "sending" | "done";

const TARGETS: { key: Target; name: string; desc: string; icon: typeof Globe }[] = [
  { key: "suvichaar_live", name: "Suvichaar Live", desc: "Direct API · suvichaar.org", icon: Globe },
  { key: "webhook", name: "Webhook", desc: "Custom endpoint", icon: Zap },
];

export function PublishDialog({ story, onClose }: Props) {
  const open = !!story;
  const [states, setStates] = useState<Record<Target, TargetState>>({ suvichaar_live: "idle", webhook: "idle" });
  const [webhookUrl, setWebhookUrl] = useState("");
  const publish = usePublishMutation();

  const handlePublish = async (target: Target) => {
    if (!story) return;
    if (target === "webhook" && !webhookUrl.trim()) {
      toast.error("Webhook URL required");
      return;
    }
    setStates((p) => ({ ...p, [target]: "sending" }));
    try {
      await publish.mutateAsync({
        engine: story.engine,
        storyId: story.id,
        payload: target === "webhook" ? { target, webhook_url: webhookUrl.trim() } : { target },
      });
      setStates((p) => ({ ...p, [target]: "done" }));
      toast.success("Published successfully", {
        description: target === "suvichaar_live" ? "Suvichaar Live" : "Webhook endpoint",
      });
    } catch (err) {
      setStates((p) => ({ ...p, [target]: "idle" }));
      const msg = err instanceof ApiError ? err.message : "Publish failed.";
      toast.error("Publish failed", { description: msg });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
      setStates({ suvichaar_live: "idle", webhook: "idle" });
      setWebhookUrl("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {story && (
          <>
            <DialogHeader>
              <DialogTitle className="text-balance pr-6">
                {story.title ?? "Untitled story"}
              </DialogTitle>
              <DialogDescription>
                Pick a destination to publish this {story.mode} story to.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-2">
              {TARGETS.map((target) => {
                const state = states[target.key];
                const isSending = state === "sending";
                const isDone = state === "done";
                const Icon = target.icon;

                return (
                  <div
                    key={target.key}
                    className="rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-foreground/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{target.name}</div>
                          <div className="text-xs text-muted-foreground">{target.desc}</div>
                        </div>
                      </div>

                      {isDone ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                          <Check className="h-3.5 w-3.5" />
                          Published
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isSending}
                          onClick={() => handlePublish(target.key)}
                          className="min-w-[96px]"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Sending
                            </>
                          ) : (
                            "Publish"
                          )}
                        </Button>
                      )}
                    </div>

                    {target.key === "webhook" && !isDone && (
                      <div className="mt-3 space-y-1.5">
                        <Label htmlFor="webhook-url" className="text-xs text-muted-foreground">
                          Webhook URL
                        </Label>
                        <Input
                          id="webhook-url"
                          type="url"
                          placeholder="https://example.com/incoming"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          disabled={isSending}
                          className="h-9"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
