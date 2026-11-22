export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch("/api" + url, { ...init, cache: "no-store", credentials: "same-origin" });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("json") ? await response.json() : undefined;
  if (!response.ok) {
    const fallback = response.status === 401 ? "Sign in to continue."
      : response.status === 403 ? "You don’t have access to this action."
      : "The request could not be completed.";
    throw new ApiError(response.status, body?.detail ?? fallback);
  }
  return body as T;
}

export async function api<T>(url: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (method !== "GET") {
    const csrf = await request<{ header: string; token: string }>("/auth/csrf", { signal });
    headers.set(csrf.header, csrf.token);
  }
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers.set("Content-Type", "application/json");
  return request<T>(url, {
    method, signal, headers, body: multipart ? body : body === undefined ? undefined : JSON.stringify(body),
  });
}

export function message(error: unknown): string {
  return error instanceof ApiError ? error.message : "Couldn’t connect to Shelf. Try again in a moment.";
}
