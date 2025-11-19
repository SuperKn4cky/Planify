import { and, eq, sql, desc } from "drizzle-orm";
import type { DB } from "../db/drizzle.js";
import {
    tasks,
    users,
    users_own_folders,
    users_own_tasks,
} from "../db/schema.js";
import AppError from "../middlewares/errorHandler.js";
import { NewTask, Task } from "../DTO/taskDTO.js";
import { InMemoryTaskLockManager } from "./taskLockManager.js";

export default class TaskService {
    private db: DB;
    private taskLockManager: InMemoryTaskLockManager;

    public constructor(db: DB) {
        this.db = db;
        this.taskLockManager = new InMemoryTaskLockManager();
    }

    private async ensureFolderWriteAccess(
        folderId: number,
        userId: number,
    ): Promise<void> {
        const res = await this.db
            .select({ permission: users_own_folders.permission })
            .from(users_own_folders)
            .where(
                and(
                    eq(users_own_folders.folder_id, folderId),
                    eq(users_own_folders.user_id, userId),
                ),
            )
            .limit(1);

        if (res.length === 0) {
            throw new AppError(
                "You do not have permission on this folder",
                403,
            );
        }
        const perm = res[0].permission;
        if (perm === "read") {
            throw new AppError("Folder is read-only for this user", 403);
        }
    }

    private async ensureUserExists(userId: number): Promise<void> {
        const res = await this.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        if (res.length === 0)
            throw new AppError("Responsible user not found", 400);
    }

    private async ensureTaskWriteAccess(
        taskId: number,
        userId: number,
    ): Promise<void> {
        const res = await this.db
            .select({ permission: users_own_tasks.permission })
            .from(users_own_tasks)
            .where(
                and(
                    eq(users_own_tasks.task_id, taskId),
                    eq(users_own_tasks.user_id, userId),
                ),
            )
            .limit(1);

        if (res.length === 0) {
            throw new AppError("You do not have permission on this task", 403);
        }
        const perm = res[0].permission;
        if (perm === "read") {
            throw new AppError("Task is read-only for this user", 403);
        }
    }

    public async startEditing(taskId: number, userId: number): Promise<void> {
        await this.ensureTaskWriteAccess(taskId, userId);
        this.taskLockManager.acquire(taskId, userId);
    }

    public async stopEditing(taskId: number, userId: number): Promise<void> {
        await this.ensureTaskWriteAccess(taskId, userId);
        this.taskLockManager.release(taskId, userId);
    }

    private async ensureNotLockedByOther(
        taskId: number,
        userId: number,
    ): Promise<void> {
        this.taskLockManager.acquire(taskId, userId);
    }

    public async createTask(
        payload: NewTask,
        creatorUserId: number,
    ): Promise<Task> {
        try {
            if (payload.folder_id != null) {
                await this.ensureFolderWriteAccess(
                    payload.folder_id,
                    creatorUserId,
                );
            }

            const responsibleUser: number | null =
                payload.responsible_user ?? creatorUserId;
            if (responsibleUser != null) {
                await this.ensureUserExists(responsibleUser);
            }

            const created = await this.db.transaction(async (t) => {
                const inserted = await t
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

                if (inserted.length === 0) {
                    throw new AppError("Task creation failed", 500);
                }

                await t.insert(users_own_tasks).values({
                    user_id: creatorUserId,
                    task_id: inserted[0].id,
                    permission: "owner",
                });

                return inserted[0];
            });

            return new Task(created);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Task creation failed", 500);
        }
    }

    public async deleteTaskByID(taskId: number, userId: number): Promise<void> {
        const exists = await this.db
            .select({ id: tasks.id })
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (exists.length === 0) {
            throw new AppError("Task not found", 404);
        }

        await this.ensureTaskWriteAccess(taskId, userId);
        await this.ensureNotLockedByOther(taskId, userId);

        const result = await this.db
            .delete(tasks)
            .where(eq(tasks.id, taskId))
            .returning();
        if (result.length === 0) {
            throw new AppError("Task not found", 404);
        }

        this.taskLockManager.release(taskId, userId);
    }

    public async getTasksForUser(
        userId: number,
        page: number,
        pageSize: number,
    ) {
        const offset = (page - 1) * pageSize;

        const [countRow] = await this.db
            .select({
                count: sql<number>`COUNT(*)`,
            })
            .from(tasks)
            .innerJoin(
                users_own_tasks,
                and(
                    eq(users_own_tasks.task_id, tasks.id),
                    eq(users_own_tasks.user_id, userId),
                ),
            );

        const total = Number(countRow.count ?? 0);

        const rows = await this.db
            .select({
                task: tasks,
                permission: users_own_tasks.permission,
            })
            .from(tasks)
            .innerJoin(
                users_own_tasks,
                and(
                    eq(users_own_tasks.task_id, tasks.id),
                    eq(users_own_tasks.user_id, userId),
                ),
            )
            .orderBy(desc(tasks.id))
            .limit(pageSize)
            .offset(offset);

        const items = rows.map((row) => {
            const task = row.task;
            const { isLocked, lockedByMe } = this.taskLockManager.getStatus(
                task.id,
                userId,
            );

            return {
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                duedate: task.due_date,
                folderid: task.folder_id,
                responsibleuser: task.responsible_user,
                permission: row.permission,
                isLocked,
                lockedByMe,
            };
        });

        return { items, total };
    }
}
