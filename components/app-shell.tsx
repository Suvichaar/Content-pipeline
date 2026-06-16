"use client";

import { useState } from "react";
import { Navbar, type Section } from "@/components/dashboard/navbar";
import { Dashboard } from "@/components/dashboard/dashboard";
import { CreateForm } from "@/components/create/create-form";
import { StoryboardPage } from "@/components/storyboard/storyboard-page";
import { SubscribersPage } from "@/components/subscribers/subscribers-page";

export function AppShell() {
  const [section, setSection] = useState<Section>("library");

  return (
    <div className="min-h-dvh bg-background">
      <Navbar section={section} onSection={setSection} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {section === "library" ? (
          <Dashboard />
        ) : section === "storyboard" ? (
          <StoryboardPage />
        ) : section === "subscribers" ? (
          <SubscribersPage />
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Create story</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate a new AMP web story from a URL, text, or notes.
              </p>
            </div>
            <CreateForm />
          </div>
        )}
      </main>
    </div>
  );
}
