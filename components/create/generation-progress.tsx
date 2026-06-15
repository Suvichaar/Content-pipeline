"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerationStep } from "@/hooks/use-create-story";

const STEPS: { key: GenerationStep; label: string; desc: string }[] = [
  { key: "uploading", label: "Uploading", desc: "Sending inputs to the engine" },
  { key: "generating", label: "Generating", desc: "AI is writing slides and rendering media" },
  { key: "finalizing", label: "Finalizing", desc: "Storing assets and rendering HTML" },
];

interface Props {
  step: GenerationStep;
}

export function GenerationProgress({ step }: Props) {
  const activeIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-foreground" />
        <span className="text-sm font-medium">Working on it…</span>
      </div>
      <ol className="mt-5 space-y-3">
        {STEPS.map((s, i) => {
          const done = i < activeIdx;
          const current = i === activeIdx;
          return (
            <li key={s.key} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                  done && "border-success bg-success text-success-foreground",
                  current && "border-foreground bg-background text-foreground",
                  !done && !current && "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : current ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div
                  className={cn(
                    "text-sm",
                    done && "text-muted-foreground line-through",
                    current && "font-medium text-foreground",
                    !done && !current && "text-muted-foreground"
                  )}
                >
                  {s.label}
                </div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-xs text-muted-foreground">
        This can take 1–3 minutes depending on slide count and image generation.
      </p>
    </div>
  );
}
