export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname.includes("topplaced.com")) {
      return "https://api.topplaced.com";
    }
  }
  return "http://localhost:5000";
}

const API_BASE = getApiBaseUrl();

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1] ||
    null
  );
}

export function getCurrentAdminUser(): any {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export async function adminFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== "undefined") {
      // Unauthorized or non-admin access
      const isExpired = response.status === 401;
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || (isExpired ? "Admin session expired. Please sign in." : "Access restricted: Super Administrator credentials required.");
      throw new Error(message);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Admin API Error (${response.status})`);
  }

  // Handle binary/file downloads
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/csv") || contentType.includes("application/octet-stream")) {
    return response as any;
  }

  return response.json();
}
