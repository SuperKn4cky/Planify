export async function postJSON<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
): Promise<T> {
    const url = path.startsWith("/api")
        ? path
        : `/api${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
        credentials: "include",
        body: JSON.stringify(body ?? {}),
        ...init,
    });
    let data: unknown = null;
    try {
        data = await res.json();
    } catch {
        /* ignore */
    }
    if (!res.ok) {
        const message =
            (data as { message?: string })?.message ||
            (data as { error?: string })?.error ||
            `Erreur ${res.status}`;
        throw new Error(String(message));
    }
    return data as T;
}

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
    const url = path.startsWith("api")
        ? path
        : `api${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        ...(init ?? {}),
    });
    let data: unknown = null;
    try {
        data = await res.json();
    } catch {}
    if (!res.ok) {
        const message =
            (data as any)?.message ??
            (data as any)?.error ??
            `Erreur ${res.status}`;
        throw new Error(String(message));
    }
    return data as T;
}

export async function putJSON<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
): Promise<T> {
    const url = path.startsWith("api")
        ? path
        : `api${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
        credentials: "include",
        body: body != null ? JSON.stringify(body) : undefined,
        ...(init ?? {}),
    });
    let data: unknown = null;
    try {
        data = await res.json();
    } catch {}
    if (!res.ok) {
        const message =
            (data as any)?.message ??
            (data as any)?.error ??
            `Erreur ${res.status}`;
        throw new Error(String(message));
    }
    return data as T;
}

export async function delJSON<T>(path: string, init?: RequestInit): Promise<T> {
    const url = path.startsWith("api")
        ? path
        : `api${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        ...(init ?? {}),
    });
    let data: unknown = null;
    try {
        data = await res.json();
    } catch {}
    if (!res.ok) {
        const message =
            (data as any)?.message ??
            (data as any)?.error ??
            `Erreur ${res.status}`;
        throw new Error(String(message));
    }
    return data as T;
}
