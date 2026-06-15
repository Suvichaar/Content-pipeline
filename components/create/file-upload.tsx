"use client";

import { UploadCloud, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  label: string;
  hint?: string;
  accept: string[];
  files: File[];
  onChange: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileUpload({ label, hint, accept, files, onChange, multiple = true, disabled }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const handlePick = () => ref.current?.click();

  const handleAdd = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming);
    onChange(multiple ? [...files, ...next] : next.slice(0, 1));
    if (ref.current) ref.current.value = "";
  };

  const handleRemove = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled) handleAdd(e.dataTransfer.files);
        }}
      >
        <UploadCloud className="h-5 w-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={handlePick} disabled={disabled}>
          Choose files
        </Button>
        <input
          ref={ref}
          type="file"
          multiple={multiple}
          accept={accept.join(",")}
          onChange={(e) => handleAdd(e.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-xs"
            >
              <div className="flex-1 truncate">
                <div className="font-medium truncate">{f.name}</div>
                <div className="text-muted-foreground">{formatSize(f.size)}</div>
              </div>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => handleRemove(i)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
