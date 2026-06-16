"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SubscribersList } from "./subscribers-list";
import { SubscriberForm } from "./subscriber-form";
import { SubscribersBulkUpload } from "./subscribers-bulk-upload";

type Tab = "list" | "create" | "bulk";

const TABS: { key: Tab; label: string }[] = [
  { key: "list", label: "Library" },
  { key: "create", label: "New" },
  { key: "bulk", label: "Bulk upload" },
];

export function SubscribersPage() {
  const [tab, setTab] = useState<Tab>("list");

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Subscribers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People who can receive broadcasts. Auto-populated from Razorpay; manual + CSV add available.
          </p>
        </div>
        <nav
          className="inline-flex rounded-lg border border-border bg-secondary/50 p-1"
          role="tablist"
        >
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === "list" && <SubscribersList onCreate={() => setTab("create")} />}
      {tab === "create" && <SubscriberForm onSaved={() => setTab("list")} />}
      {tab === "bulk" && <SubscribersBulkUpload onDone={() => setTab("list")} />}
    </div>
  );
}
