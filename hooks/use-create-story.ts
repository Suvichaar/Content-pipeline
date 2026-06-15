"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createStory, type CreateStoryInput, type GeneratedStoryResult } from "@/lib/api/create";

export type GenerationStep = "uploading" | "generating" | "finalizing";

export function useCreateStory() {
  const qc = useQueryClient();
  const [step, setStep] = useState<GenerationStep>("uploading");

  const mutation = useMutation<GeneratedStoryResult, Error, CreateStoryInput>({
    mutationFn: createStory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  // Stage progression for UX while job runs.
  useEffect(() => {
    if (!mutation.isPending) {
      setStep("uploading");
      return;
    }
    setStep("uploading");
    const t1 = window.setTimeout(() => setStep("generating"), 1200);
    const t2 = window.setTimeout(() => setStep("finalizing"), 30_000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [mutation.isPending]);

  return { ...mutation, step };
}
