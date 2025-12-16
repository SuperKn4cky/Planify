export class ApiError extends Error {
    public status: number;
    public data: unknown;

    public constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

function parseApiError(data: any, status: number): string {
    if (data?.error?.message && typeof data.error.message === "string") {
        return data.error.message;
    }
    if (Array.isArray(data?.error?.messages) && data.error.messages.length) {
        return String(data.error.messages[0]);
    }
    if (typeof data?.error === "string") {
        return data.error;
    }
    if (typeof data?.message === "string") {
        return data.message;
    }
    return `Erreur ${status}`;
}

function buildApiUrl(path: string): string {
    if (/^https?:\/\//.test(path)) {
        return path;
    }
    if (path.startsWith("/api")) {
        return path;
    }
    if (path.startsWith("api")) {
        return `/${path}`;
    }
    return `/api${path.startsWith("/") ? path : `/${path}`}`;
}

function redirectToLoginIfNeeded(): void {
    if (typeof window === "undefined") {
        return;
    }
    const pathname = window.location?.pathname ?? "";
    if (
        pathname.startsWith("/auth/login") ||
        pathname.startsWith("/auth/register")
    ) {
        return;
    }
    window.location.assign("/auth/login");
}

async function requestJSON<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
    init?: RequestInit,
): Promise<T> {
    const url = buildApiUrl(path);

    const headers = new Headers(init?.headers);
    if (body !== undefined && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
        method,
        credentials: "include",
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...init,
    });

    let data: any = null;
    const text = await res.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (res.status === 401) {
        redirectToLoginIfNeeded();
    }

    if (!res.ok) {
        const message = parseApiError(data, res.status);
        throw new ApiError(message, res.status, data);
    }

    return data as T;
}

export const getJSON = <T>(path: string, init?: RequestInit) =>
    requestJSON<T>("GET", path, undefined, init);

export const postJSON = <T>(path: string, body?: unknown, init?: RequestInit) =>
    requestJSON<T>("POST", path, body, init);

export const putJSON = <T>(path: string, body?: unknown, init?: RequestInit) =>
    requestJSON<T>("PUT", path, body, init);

export const delJSON = <T>(path: string, init?: RequestInit) =>
    requestJSON<T>("DELETE", path, undefined, init);
