const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("traveloop_token");
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || res.statusText || "Request failed", res.status, data);
  }

  return data as T;
}

export function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const headers = new Headers();
  const token = typeof window !== "undefined" ? localStorage.getItem("traveloop_token") : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(data?.error || res.statusText || "Upload failed", res.status, data);
  }
  return data as { url: string };
}
