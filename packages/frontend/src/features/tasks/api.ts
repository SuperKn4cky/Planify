import { getJSON, postJSON, delJSON, putJSON } from "@/lib/api";
import type { Task, TaskStatus, TaskShareRow, Contact } from "./types";

export async function createTask(input: {
    title: string;
    description?: string | null;
    due_date?: string | null;
    status?: TaskStatus;
    priority?: number;
    folderId?: number | null;
    responsibleUserId?: number | null;
}) {
    const res = await postJSON<{ message: string; data: Task }>(
        "/api/tasks",
        input,
    );
    return res.data;
}

export async function deleteTask(id: number) {
    return delJSON<{ message: string }>(`/api/tasks/${id}`);
}

export async function listTasks(params?: {
    q?: string;
    status?: "all" | TaskStatus;
    folderId?: number | "all" | "none";
    sort?: "recent" | "oldest";
    page?: number;
    pageSize?: number;
    scope?: "all" | "mine" | "shared";
    dueDate?: "all" | "overdue" | "today" | "week" | "month" | "none";
}) {
    const search = new URLSearchParams();

    if (params?.q) search.set("q", params.q);
    if (params?.status && params.status !== "all") {
        search.set("status", params.status);
    }
    if (params?.folderId && params.folderId !== "all") {
        search.set("folder_id", String(params.folderId));
    }
    if (params?.sort) search.set("sort", params.sort);
    if (params?.page) search.set("page", String(params.page));
    if (params?.pageSize) search.set("page_size", String(params.pageSize));
    if (params?.scope && params.scope !== "all") {
        search.set("scope", params.scope);
    }
    if (params?.dueDate) {
        search.set("due_date", params.dueDate);
    }

    const qs = search.toString();
    const path = qs ? `/api/tasks?${qs}` : "/api/tasks";

    return getJSON<{
        items: Task[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    }>(path);
}

// Folder APIs

export async function listFolders() {
    const res = await getJSON<{
        data: Array<{ id: number; name: string; permission: string }>;
    }>("/api/folders");

    return res.data;
}

export async function createFolder(name: string) {
    const res = await postJSON<{
        message: string;
        data: { id: number; name: string; permission?: string };
    }>("/api/folders", { name });

    return res.data;
}

export async function deleteFolder(id: number) {
    return delJSON<{ message: string }>(`/api/folders/${id}`);
}

// Task Sharing APIs

export async function listContacts(): Promise<Contact[]> {
    return getJSON<Contact[]>("/api/contacts");
}

export async function listTaskShares(taskId: number): Promise<TaskShareRow[]> {
    return getJSON<TaskShareRow[]>(`/api/tasks/${taskId}/shares`);
}

export async function shareTask(
    taskId: number,
    userId: number,
    permission: "read" | "write",
): Promise<void> {
    await postJSON(`/api/tasks/${taskId}/shares`, { userId, permission });
}

export async function revokeTaskShare(
    taskId: number,
    userId: number,
): Promise<void> {
    await delJSON(`/api/tasks/${taskId}/shares/${userId}`);
}
