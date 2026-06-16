"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Save, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSubscriber,
  type SubscriberCreatePayload,
  type SubscriberStatus,
} from "@/lib/api/subscribers";

interface Props {
  onSaved: () => void;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  status: SubscriberStatus;
  tags: string[];
  tagInput: string;
}

const INITIAL: FormState = {
  name: "",
  phone: "",
  email: "",
  status: "active",
  tags: [],
  tagInput: "",
};

export function SubscriberForm({ onSaved }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (payload: SubscriberCreatePayload) => createSubscriber(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscribers"] });
      qc.invalidateQueries({ queryKey: ["subscriber-tags"] });
      setForm(INITIAL);
      setErrorMsg(null);
      onSaved();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : "Failed to save"),
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const t = form.tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, t], tagInput: "" }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!phone && !email) {
      setErrorMsg("Phone or email is required.");
      return;
    }
    mut.mutate({
      name: form.name.trim() || null,
      phone: phone || null,
      email: email || null,
      tags: form.tags,
      status: form.status,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-border bg-card p-5">
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Ravi Kumar"
          />
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => update("status", v as SubscriberStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Phone" hint="Include country code, e.g. +9198…">
          <Input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+919876543210"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="ravi@example.com"
          />
        </Field>
      </div>

      <Field label="Tags / Categories" hint="Used to target broadcasts.">
        <div className="flex gap-2">
          <Input
            value={form.tagInput}
            onChange={(e) => update("tagInput", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="movies"
          />
          <Button type="button" variant="secondary" onClick={addTag}>
            Add
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {form.tags.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                {t}
                <button
                  type="button"
                  onClick={() => update("tags", form.tags.filter((x) => x !== t))}
                  className="rounded hover:bg-foreground/10"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Field>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={() => setForm(INITIAL)}>
          Reset
        </Button>
        <Button type="submit" disabled={mut.isPending}>
          <Save className="h-4 w-4" />
          {mut.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
