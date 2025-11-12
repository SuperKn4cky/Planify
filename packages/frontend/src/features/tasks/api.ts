import { getJSON, postJSON, delJSON, putJSON } from "@/lib/api";
import type { Task, TaskStatus } from "./types";

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
        "api/tasks",
        input,
    );
    return res.data;
}

export async function deleteTask(id: number) {
    return delJSON<{ message: string }>(`api/tasks/${id}`);
}

export async function listTasks(params?: {
    q?: string;
    status?: "all" | TaskStatus;
    folderId?: number | "all";
    sort?: "recent" | "oldest";
}) {
    // TODO: GET /tasks?q=&status=&folderId=&sort=
    // return getJSON<{ data: Task[] }>('api/tasks', { /* signal/abort, params */ });
    return { data: [] as Task[] }; // placeholder
}

export async function updateTask(id: number, patch: Partial<Task>) {
    // TODO: PUT /tasks/:id
    // return putJSON<Task>(`api/tasks/${id}`, patch);
    return { id, ...patch } as Task; // placeholder
}

export async function toggleTaskStatus(id: number, status: TaskStatus) {
    // TODO: PATCH /tasks/:id/status
    // return putJSON<Task>(`api/tasks/${id}/status`, { status });
    return { id, status } as Task; // placeholder
}

export async function listFolders() {
    // TODO: GET /folders
    return { data: [] as Array<{ id: number; name: string }> }; // placeholder
}

export async function createFolder(name: string) {
    // TODO: POST /folders
    return { id: Math.floor(Math.random() * 1e6), name }; // placeholder
}
