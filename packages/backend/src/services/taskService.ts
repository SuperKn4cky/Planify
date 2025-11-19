import { and, or, eq, ne, sql, asc, desc, ilike } from "drizzle-orm";
import type { DB } from "../db/drizzle.js";
import {
    tasks,
    users,
    users_own_folders,
    users_own_tasks,
} from "../db/schema.js";
import AppError from "../middlewares/errorHandler.js";
import { NewTask, Task, UpdateTask } from "../DTO/taskDTO.js";
import { InMemoryTaskLockManager } from "./taskLockManager.js";

type TaskListFilters = {
    status: "all" | "todo" | "doing" | "done";
    sort: "recent" | "oldest";
    scope: "all" | "mine" | "shared";
    query: string | null;
};

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
        const { isLocked } = this.taskLockManager.getStatus(taskId, userId);
        if (isLocked) {
            throw new AppError("Task is currently being edited", 409);
        }
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

    public async updateTaskByID(
        taskId: number,
        userId: number,
        payload: UpdateTask,
    ): Promise<Task> {
        const existing = await this.db
            .select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (existing.length === 0) {
            throw new AppError("Task not found", 404);
        }

        await this.ensureTaskWriteAccess(taskId, userId);
        await this.ensureNotLockedByOther(taskId, userId);

        if (payload.folderid !== undefined && payload.folderid !== null) {
            await this.ensureFolderWriteAccess(payload.folderid, userId);
        }

        if (
            payload.responsibleuser !== undefined &&
            payload.responsibleuser !== null
        ) {
            await this.ensureUserExists(payload.responsibleuser);
        }

        const updateData: Partial<typeof tasks.$inferInsert> = {};

        if (payload.title !== undefined) {
            updateData.title = payload.title;
        }
        if (payload.description !== undefined) {
            updateData.description = payload.description;
        }
        if (payload.folderid !== undefined) {
            updateData.folder_id = payload.folderid;
        }
        if (payload.responsibleuser !== undefined) {
            updateData.responsible_user = payload.responsibleuser;
        }
        if (payload.duedate !== undefined) {
            updateData.due_date = payload.duedate;
        }
        if (payload.status !== undefined) {
            updateData.status = payload.status;
        }
        if (payload.priority !== undefined) {
            updateData.priority = payload.priority;
        }

        if (Object.keys(updateData).length === 0) {
            return new Task(existing[0], true);
        }

        const updated = await this.db
            .update(tasks)
            .set(updateData)
            .where(eq(tasks.id, taskId))
            .returning();

        if (updated.length === 0) {
            throw new AppError("Task not found", 404);
        }

        return new Task(updated[0], true);
    }

    public async getTaskByID(taskId: number, userId: number): Promise<Task> {
        const existing = await this.db
            .select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (existing.length === 0) {
            throw new AppError("Task not found", 404);
        }

        await this.ensureTaskWriteAccess(taskId, userId);

        return new Task(existing[0]);
    }

    public async getTasksForUser(
        userId: number,
        page: number,
        pageSize: number,
        filters: TaskListFilters,
    ) {
        const offset = (page - 1) * pageSize;

        const whereParts = [
            eq(users_own_tasks.user_id, userId),
            eq(users_own_tasks.task_id, tasks.id),
        ];

        if (filters.status !== "all") {
            whereParts.push(eq(tasks.status, filters.status));
        }

        if (filters.scope === "mine") {
            whereParts.push(eq(users_own_tasks.permission, "owner"));
        } else if (filters.scope === "shared") {
            whereParts.push(ne(users_own_tasks.permission, "owner"));
        }

        if (filters.query) {
            const pattern = `%${filters.query
                .replace(/%/g, "\\%")
                .replace(/_/g, "\\_")}%`;

            const searchCond = or(
                ilike(tasks.title, pattern),
                ilike(tasks.description, pattern),
            );

            if (searchCond) {
                whereParts.push(searchCond);
            }
        }

        const whereClause = and(...whereParts);

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
            )
            .where(whereClause);

        const total = Number(countRow.count ?? 0);

        const orderByExpr =
            filters.sort === "oldest" ? asc(tasks.id) : desc(tasks.id);

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
            .where(whereClause)
            .orderBy(orderByExpr)
            .limit(pageSize)
            .offset(offset);

        const items = rows.map((row) => {
            const t = row.task;
            const { isLocked, lockedByMe } = this.taskLockManager.getStatus(
                t.id,
                userId,
            );

            return {
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                due_date: t.due_date,
                folder_id: t.folder_id,
                responsible_user: t.responsible_user,
                permission: row.permission,
                isLocked,
                lockedByMe,
            };
        });

        return { items, total };
    }
}
