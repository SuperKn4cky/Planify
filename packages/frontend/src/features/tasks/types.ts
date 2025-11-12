export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = 1 | 2 | 3;

export interface Task {
    id: number;
    title: string;
    description?: string | null;
    due_date?: string | null;
    status: TaskStatus;
    priority: number;
    folderId?: number | null;
    responsibleUserId?: number | null;

    tags?: string[];
    assignees?: string[];
}
