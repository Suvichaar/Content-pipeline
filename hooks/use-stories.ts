"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAllStories,
  publishStory,
  type PublishRequest,
  type StoryFilters,
  type UnifiedStory,
} from "@/lib/api/stories";
import type { Engine } from "@/lib/api/client";

const STORIES_KEY = ["stories"] as const;

export function useStories(filters: StoryFilters & { enabled?: boolean } = {}) {
  const { enabled = true, ...rest } = filters;
  return useQuery({
    queryKey: [...STORIES_KEY, rest],
    queryFn: () => listAllStories(rest),
    enabled,
    staleTime: 30_000,
  });
}

export function usePublishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ engine, storyId, payload }: { engine: Engine; storyId: string; payload: PublishRequest }) =>
      publishStory(engine, storyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORIES_KEY });
    },
  });
}

export type { UnifiedStory };
