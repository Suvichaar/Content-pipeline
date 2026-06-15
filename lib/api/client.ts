import { authStore } from "@/lib/auth/store";

export type Engine = "news" | "curious";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const ENV_BASE: Record<Engine, string | undefined> = {
  news: process.env.NEXT_PUBLIC_NEWS_API_BASE_URL,
  curious: process.env.NEXT_PUBLIC_CURIOUS_API_BASE_URL,
};

export function getBaseUrl(engine: Engine): string {
  const base = ENV_BASE[engine];
  if (!base) {
    throw new ApiError(
      `Missing NEXT_PUBLIC_${engine.toUpperCase()}_API_BASE_URL env var.`,
      0,
      null
    );
  }
  return base.replace(/\/+$/, "");
}

interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
}

export async function apiFetch<T = unknown>(
  engine: Engine,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, body, headers = {}, ...rest } = options;
  const url = `${getBaseUrl(engine)}${path}`;

  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] ?? "application/json";
  }
  if (auth) {
    const token = authStore.getToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 401 && auth) {
    authStore.clear();
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const detail =
      (payload && typeof payload === "object" && "detail" in payload && (payload as { detail: unknown }).detail) ||
      payload ||
      response.statusText;
    const message =
      typeof detail === "string" ? detail : `${response.status} ${response.statusText}`;
    throw new ApiError(message, response.status, detail);
  }

  return payload as T;
}
