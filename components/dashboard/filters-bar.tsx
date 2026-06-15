"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/labels";
import type { Filters } from "@/lib/types";

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
}

const INITIAL: Filters = { search: "", mode: "all", category: "all", date: "all" };

export function FiltersBar({ filters, onChange }: Props) {
  const isDirty =
    filters.search !== INITIAL.search ||
    filters.mode !== INITIAL.mode ||
    filters.category !== INITIAL.category ||
    filters.date !== INITIAL.date;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by title…"
          className="h-9 pl-9"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:w-auto">
        <Select
          value={filters.mode}
          onValueChange={(v) => onChange({ ...filters, mode: v as Filters["mode"] })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="curious">Curious</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.category}
          onValueChange={(v) => onChange({ ...filters, category: v })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.date}
          onValueChange={(v) => onChange({ ...filters, date: v as Filters["date"] })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isDirty && (
        <Button variant="ghost" size="sm" onClick={() => onChange(INITIAL)} className="shrink-0">
          <X className="h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}
