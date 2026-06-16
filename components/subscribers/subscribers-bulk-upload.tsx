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
  bulkCreateSubscribers,
  type SubscriberBulkCreateResponse,
  type SubscriberCreatePayload,
  type SubscriberStatus,
} from "@/lib/api/subscribers";

interface Props {
  onDone: () => void;
}

const TEMPLATE_HEADERS = ["name", "phone", "email", "tags", "status"];
const TEMPLATE_SAMPLE = [
  "Ravi Kumar",
  "+919876543210",
  "ravi@example.com",
  "movies;news",
  "active",
];

interface ParsedRow {
  index: number;
  ok: boolean;
  errors: string[];
  payload: SubscriberCreatePayload;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\-\s]{6,}$/;

export function SubscribersBulkUpload({ onDone }: Props) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<SubscriberBulkCreateResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      bulkCreateSubscribers((rows ?? []).filter((r) => r.ok).map((r) => r.payload)),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ["subscribers"] });
      qc.invalidateQueries({ queryKey: ["subscriber-tags"] });
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
    a.download = "subscribers-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    setErrorMsg(null);
    setResult(null);
    setFilename(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
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
            Columns: <code>name</code>, <code>phone</code>, <code>email</code>, <code>tags</code> (semicolon-separated), <code>status</code>. Phone or email is required.
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
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.index} className={r.ok ? "" : "bg-destructive/5"}>
                    <TableCell className="text-xs text-muted-foreground">{r.index + 1}</TableCell>
                    <TableCell className="text-sm">{r.payload.name ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono">{r.payload.phone ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.payload.email ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(r.payload.tags ?? []).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {r.payload.status ?? "active"}
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

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
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
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line, i) => {
    const cells = parseCsvLine(line);
    const raw: Record<string, string> = {};
    header.forEach((h, idx) => {
      raw[h] = cells[idx] ?? "";
    });
    const phone = (raw.phone ?? "").trim() || null;
    const email = (raw.email ?? "").trim() || null;
    const errors: string[] = [];
    if (!phone && !email) errors.push("phone or email required");
    if (phone && !PHONE_RE.test(phone.replace(/[\s-]/g, ""))) errors.push("invalid phone");
    if (email && !EMAIL_RE.test(email)) errors.push("invalid email");
    const status = ((raw.status ?? "").trim() || "active") as SubscriberStatus;
    if (!["active", "inactive", "cancelled"].includes(status))
      errors.push(`status must be active/inactive/cancelled (got "${status}")`);
    const tags = (raw.tags ?? "")
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      index: i,
      ok: errors.length === 0,
      errors,
      payload: {
        name: (raw.name ?? "").trim() || null,
        phone: phone ? phone.replace(/[\s-]/g, "") : null,
        email,
        tags,
        status,
      },
    };
  });
}
