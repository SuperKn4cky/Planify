export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = 1 | 2 | 3;
export type TaskPermission = "owner" | "read" | "write";

export interface Task {
    id: number;
    title: string;
    description?: string | null;
    due_date?: string | null;
    status: TaskStatus;
    priority: number;
    folder_id?: number | null;
    responsible_user?: number | null;

    permission?: TaskPermission;

    isLocked?: boolean;
    lockedByMe?: boolean;

    tags?: string[];
    assignees?: string[];
}

export interface TaskShareRow {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    permission: TaskPermission;
}

export interface Contact {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}
