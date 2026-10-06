/** Thin browser client for the JSON API (`{ data }` / `{ error }` envelopes). */

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers: options.body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: isForm ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError("We couldn't reach the server. Check your connection and try again.", 0);
  }
  let json: { data?: T; error?: { message?: string; fields?: Record<string, string> } } | null = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  if (!response.ok || !json) {
    throw new ApiClientError(
      json?.error?.message ?? "Something went wrong. Please try again.",
      response.status,
      json?.error?.fields
    );
  }
  return json.data as T;
}

export const errorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") =>
  error instanceof ApiClientError ? error.message : fallback;

export const errorFields = (error: unknown): Record<string, string> =>
  error instanceof ApiClientError ? (error.fields ?? {}) : {};

export async function uploadImage(file: File, folder: "references" | "reviews" | "products"): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  form.set("folder", folder);
  const { url } = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
  return url;
}
