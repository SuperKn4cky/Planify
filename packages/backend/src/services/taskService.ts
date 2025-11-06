import { and, eq } from "drizzle-orm";
import type { DB } from "../db/drizzle.js";
import { tasks, users, users_own_folders, users_own_tasks } from "../db/schema.js";
import AppError from "../middlewares/errorHandler.js";
import { NewTask, Task } from "../DTO/taskDTO.js";

export default class TaskService {
    private db: DB;

    public constructor(db: DB) {
        this.db = db;
    }

    private async ensureFolderWriteAccess(folderId: number, userId: number): Promise<void> {
        const res = await this.db
            .select({ permission: users_own_folders.permission })
            .from(users_own_folders)
            .where(and(eq(users_own_folders.folder_id, folderId), eq(users_own_folders.user_id, userId)))
            .limit(1);

        if (res.length === 0) {
            throw new AppError("You do not have permission on this folder", 403);
        }
        const perm = res[0].permission;
        if (perm === "read") {
            throw new AppError("Folder is read-only for this user", 403);
        }
    }

    private async ensureUserExists(userId: number): Promise<void> {
        const res = await this.db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
        if (res.length === 0) throw new AppError("Responsible user not found", 400);
    }

    public async createTask(payload: NewTask, creatorUserId: number): Promise<Task> {
        try {
            if (payload.folder_id != null) {
                await this.ensureFolderWriteAccess(payload.folder_id, creatorUserId);
            }

            const responsibleUser: number | null = payload.responsible_user ?? creatorUserId;
            if (responsibleUser != null) {
                await this.ensureUserExists(responsibleUser);
            }

            const inserted = await this.db
                .insert(tasks)
                .values({
                    folder_id: payload.folder_id ?? null,
                    responsible_user: responsibleUser,
                    title: payload.title,
                    description: payload.description ?? null,
                    due_date: payload.due_date ?? null,
                    status: payload.status ?? "todo",
                    priority: payload.priority ?? 1,
                })
                .returning();

            if (inserted.length === 0) throw new AppError("Task creation failed", 500);

            await this.db.insert(users_own_tasks).values({
                user_id: creatorUserId,
                task_id: inserted[0].id,
                permission: "owner",
            });

            return new Task(inserted[0]);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Task creation failed", 500);
        }
    }
}
