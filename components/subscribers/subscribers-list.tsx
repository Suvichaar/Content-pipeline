"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteSubscriber,
  listSubscribers,
  listSubscriberTags,
  type SubscriberItem,
  type SubscriberStatus,
} from "@/lib/api/subscribers";

const PAGE_SIZE = 20;

interface Props {
  onCreate: () => void;
}

export function SubscribersList({ onCreate }: Props) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<SubscriberStatus | "all">("active");
  const qc = useQueryClient();

  const filters = useMemo(
    () => ({
      q: search.trim() || undefined,
      tag: tagFilter === "all" ? undefined : tagFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [search, tagFilter, statusFilter, page]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["subscribers", filters],
    queryFn: () => listSubscribers(filters),
    placeholderData: (prev) => prev,
  });

  const { data: tagsData } = useQuery({
    queryKey: ["subscriber-tags"],
    queryFn: () => listSubscriberTags(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSubscriber(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscribers"] });
      qc.invalidateQueries({ queryKey: ["subscriber-tags"] });
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search name, phone, email…"
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
          className="h-9 max-w-xs"
        />
        <Select
          value={tagFilter}
          onValueChange={(v) => {
            setPage(0);
            setTagFilter(v);
          }}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {(tagsData?.items ?? []).map((t) => (
              <SelectItem key={t.tag} value={t.tag}>
                {t.tag} <span className="text-muted-foreground">({t.count})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setPage(0);
            setStatusFilter(v as SubscriberStatus | "all");
          }}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {showingFrom}–{showingTo} of {total}
          </span>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error instanceof Error ? error.message : "Failed to load subscribers"}
        </div>
      ) : isLoading && !data ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState onCreate={onCreate} />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <Row key={it.id} item={it} onDelete={() => deleteMut.mutate(it.id)} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tabular-nums">
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
            disabled={page + 1 >= totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ item, onDelete }: { item: SubscriberItem; onDelete: () => void }) {
  return (
    <TableRow>
      <TableCell className="text-sm">{item.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
      <TableCell className="text-xs font-mono">{item.phone ?? "—"}</TableCell>
      <TableCell className="text-xs">{item.email ?? "—"}</TableCell>
      <TableCell>
        {item.tags.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant={
            item.status === "active"
              ? "default"
              : item.status === "cancelled"
                ? "destructive"
                : "outline"
          }
          className="text-[10px] capitalize"
        >
          {item.status}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground capitalize">{item.source.replace("_", " ")}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const id = item.phone || item.email || item.id;
            if (confirm(`Delete subscriber ${id}?`)) onDelete();
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No subscribers match</p>
      <p className="mt-1 text-xs text-muted-foreground">Add one manually, import CSV, or wait for Razorpay events.</p>
      <Button size="sm" className="mt-4" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        Add subscriber
      </Button>
    </div>
  );
}
