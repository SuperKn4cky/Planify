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
