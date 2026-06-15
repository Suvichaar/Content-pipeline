"use client";

import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { isAuthenticated, hydrated } = useAuth();

  if (!hydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  return isAuthenticated ? <AppShell /> : <LoginForm />;
}
