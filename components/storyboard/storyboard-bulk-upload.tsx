"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, Upload } from "lucide-react";

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
import {
  bulkCreateStoryboard,
  slugify,
  type StoryboardBulkCreateResponse,
  type StoryboardCreatePayload,
  type StoryboardMediaItem,
  type StoryboardStatus,
} from "@/lib/api/storyboard";

interface Props {
  onDone: () => void;
}

const TEMPLATE_HEADERS = [
  "title",
  "slug",
  "category",
  "tags",
  "cover_url",
  "media_urls",
  "language",
  "mode",
  "status",
  "external_id",
  "notes",
];

const TEMPLATE_SAMPLE = [
  "Trump-Iran oil deal recap",
  "trump-iran-oil-deal-recap",
  "News",
  "politics;iran",
  "https://media.suvichaar.org/covers/iran.jpg",
  "https://media.suvichaar.org/img/iran-1.jpg;https://media.suvichaar.org/img/iran-2.jpg",
  "en",
  "news",
  "draft",
  "",
  "Optional notes",
];

interface ParsedRow {
  index: number;
  ok: boolean;
  errors: string[];
  payload: StoryboardCreatePayload;
  raw: Record<string, string>;
}

export function StoryboardBulkUpload({ onDone }: Props) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<StoryboardBulkCreateResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      bulkCreateStoryboard({
        items: (rows ?? []).filter((r) => r.ok).map((r) => r.payload),
      }),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ["storyboard"] });
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : "Bulk upload failed"),
  });

  const validCount = useMemo(() => rows?.filter((r) => r.ok).length ?? 0, [rows]);
  const invalidCount = useMemo(() => rows?.filter((r) => !r.ok).length ?? 0, [rows]);

  function downloadTemplate() {
    const csv =
      TEMPLATE_HEADERS.join(",") + "\n" + TEMPLATE_SAMPLE.map(csvCell).join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storyboard-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    setErrorMsg(null);
    setResult(null);
    setFilename(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsvToRows(text);
      setRows(parsed);
      if (parsed.length === 0) setErrorMsg("CSV contains no data rows.");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to parse CSV");
      setRows(null);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold">Bulk upload</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Download the template, fill rows, drop the CSV here. Required columns: <code>title</code>,{" "}
            <code>slug</code>. Use <code>;</code> to separate multiple tags / media URLs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> Template
        </Button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      {!result && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card px-6 py-12 text-center"
        >
          <Upload className="mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Drop CSV here</p>
          <p className="mt-1 text-xs text-muted-foreground">or pick a file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose file
          </Button>
        </div>
      )}

      {rows && rows.length > 0 && !result && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{filename}</span>
              <Badge variant="secondary">{rows.length} rows</Badge>
              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive">{invalidCount} invalid</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRows(null);
                  setFilename("");
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                disabled={validCount === 0 || mut.isPending}
                onClick={() => mut.mutate()}
              >
                {mut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>Upload {validCount} rows</>
                )}
              </Button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.index} className={r.ok ? "" : "bg-destructive/5"}>
                    <TableCell className="text-xs text-muted-foreground">{r.index + 1}</TableCell>
                    <TableCell className="text-sm">{r.payload.title || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.payload.slug || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.payload.category || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(r.payload.tags ?? []).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {r.payload.status ?? "draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-destructive">
                      {r.errors.join(", ") || (
                        <span className="text-emerald-600 dark:text-emerald-400">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="font-medium">Upload complete</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Requested" value={result.requested} />
            <Stat label="Succeeded" value={result.succeeded} tone="emerald" />
            <Stat label="Failed" value={result.failed} tone={result.failed > 0 ? "red" : undefined} />
          </div>
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 text-xs font-medium">Errors</div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {typeof e.row === "number" ? e.row + 1 : "?"} — {String(e.error)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setRows(null); setResult(null); setFilename(""); }}>
              Upload another
            </Button>
            <Button onClick={onDone}>Done</Button>
          </div>
        </div>
      )}
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
    <div className="rounded-lg border border-border p-3">
      <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

// ── CSV parsing ─────────────────────────────────────────────────────────────

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

function parseCsvToRows(text: string): ParsedRow[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const dataLines = lines.slice(1);

  return dataLines.map((line, i) => {
    const cells = parseCsvLine(line);
    const raw: Record<string, string> = {};
    header.forEach((h, idx) => {
      raw[h] = cells[idx] ?? "";
    });

    const title = (raw.title ?? "").trim();
    const slugRaw = (raw.slug ?? "").trim();
    const slug = slugRaw || slugify(title);
    const errors: string[] = [];
    if (!title) errors.push("title is required");
    if (!slug) errors.push("slug is required");
    if (slug && !SLUG_RE.test(slug)) errors.push("slug must be lowercase alphanumerics + hyphens");

    const status = ((raw.status ?? "").trim() || "draft") as StoryboardStatus;
    if (!["draft", "published", "archived"].includes(status))
      errors.push(`status must be draft/published/archived (got "${status}")`);

    const mode = (raw.mode ?? "").trim().toLowerCase();
    let modeValue: "news" | "curious" | null = null;
    if (mode === "news" || mode === "curious") modeValue = mode;
    else if (mode) errors.push(`mode must be news/curious (got "${mode}")`);

    const tags = splitMulti(raw.tags);
    const mediaUrls: StoryboardMediaItem[] = splitMulti(raw.media_urls).map((url) => ({
      url,
      type: "image",
    }));

    const payload: StoryboardCreatePayload = {
      title,
      slug,
      category: raw.category?.trim() || null,
      tags,
      cover_url: raw.cover_url?.trim() || null,
      media_urls: mediaUrls,
      language: raw.language?.trim() || null,
      mode: modeValue,
      status,
      external_id: raw.external_id?.trim() || null,
      notes: raw.notes?.trim() || null,
    };

    return { index: i, ok: errors.length === 0, errors, payload, raw };
  });
}

function splitMulti(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}
