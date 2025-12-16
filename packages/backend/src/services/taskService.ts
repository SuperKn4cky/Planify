import { and, or, eq, ne, sql, asc, desc, ilike } from "drizzle-orm";
import type { DB } from "../db/drizzle.js";
import {
    tasks,
    users,
    users_own_folders,
    users_own_tasks,
    has_contact,
} from "../db/schema.js";
import AppError from "../middlewares/errorHandler.js";
import { NewTask, Task, UpdateTask } from "../DTO/taskDTO.js";
import { InMemoryTaskLockManager } from "./taskLockManager.js";

type TaskListFilters = {
    status: "all" | "todo" | "doing" | "done";
    sort: "recent" | "oldest";
    scope: "all" | "mine" | "shared";
    query: string | null;
    folderId: number | null;
    dueDate: "all" | "overdue" | "today" | "week" | "month" | "none";
};

type SharePermission = "read" | "write";

export type TaskShareRow = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    permission: "owner" | "read" | "write";
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

    private async ensureTaskReadAccess(
        taskId: number,
        userId: number,
    ): Promise<"owner" | "read" | "write"> {
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

        return res[0].permission;
    }

    private async ensureTaskOwnerAccess(
        taskId: number,
        userId: number,
    ): Promise<void> {
        const perm = await this.ensureTaskReadAccess(taskId, userId);
        if (perm !== "owner") {
            throw new AppError("Only the owner can manage collaboration", 403);
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

        if (payload.folder_id !== undefined && payload.folder_id !== null) {
            await this.ensureFolderWriteAccess(payload.folder_id, userId);
        }

        if (
            payload.responsible_user !== undefined &&
            payload.responsible_user !== null
        ) {
            await this.ensureUserExists(payload.responsible_user);
        }

        const updateData: Partial<typeof tasks.$inferInsert> = {};

        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined)
            updateData.description = payload.description;
        if (payload.folder_id !== undefined)
            updateData.folder_id = payload.folder_id;
        if (payload.responsible_user !== undefined)
            updateData.responsible_user = payload.responsible_user;
        if (payload.due_date !== undefined)
            updateData.due_date = payload.due_date;
        if (payload.status !== undefined) updateData.status = payload.status;
        if (payload.priority !== undefined)
            updateData.priority = payload.priority;

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

    public async getTaskByID(
        taskId: number,
        userId: number,
    ): Promise<{ task: Task; permission: "owner" | "read" | "write" }> {
        const existing = await this.db
            .select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (existing.length === 0) {
            throw new AppError("Task not found", 404);
        }

        const permission = await this.ensureTaskReadAccess(taskId, userId);
        return { task: new Task(existing[0]), permission };
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

        if (filters.folderId !== null) {
            if (filters.folderId === -1) {
                whereParts.push(sql`${tasks.folder_id} IS NULL`);
            } else {
                whereParts.push(eq(tasks.folder_id, filters.folderId));
            }
        }

        if (filters.dueDate !== "all") {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (filters.dueDate === "none") {
                whereParts.push(sql`${tasks.due_date} IS NULL`);
            } else if (filters.dueDate === "overdue") {
                whereParts.push(sql`${tasks.due_date} < ${now.toISOString()}`);
            } else if (filters.dueDate === "today") {
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                whereParts.push(
                    sql`${tasks.due_date} >= ${now.toISOString()} AND ${tasks.due_date} < ${tomorrow.toISOString()}`,
                );
            } else if (filters.dueDate === "week") {
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + 7);
                whereParts.push(
                    sql`${tasks.due_date} >= ${now.toISOString()} AND ${tasks.due_date} < ${nextWeek.toISOString()}`,
                );
            } else if (filters.dueDate === "month") {
                const nextMonth = new Date(now);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                whereParts.push(
                    sql`${tasks.due_date} >= ${now.toISOString()} AND ${tasks.due_date} < ${nextMonth.toISOString()}`,
                );
            }
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

    // Task sharing methods

    private async ensureShareTargetExists(userId: number): Promise<void> {
        const res = await this.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (res.length === 0) {
            throw new AppError("User not found", 400);
        }
    }

    private async ensureIsContact(
        ownerUserId: number,
        targetUserId: number,
    ): Promise<void> {
        const rows = await this.db
            .select()
            .from(has_contact)
            .where(
                or(
                    and(
                        eq(has_contact.user_id_1, ownerUserId),
                        eq(has_contact.user_id_2, targetUserId),
                    ),
                    and(
                        eq(has_contact.user_id_2, ownerUserId),
                        eq(has_contact.user_id_1, targetUserId),
                    ),
                ),
            )
            .limit(1);

        if (rows.length === 0) {
            throw new AppError("User is not in your contacts", 403);
        }
    }

    public async shareTask(
        taskId: number,
        ownerUserId: number,
        targetUserId: number,
        permission: SharePermission,
    ): Promise<void> {
        await this.ensureTaskOwnerAccess(taskId, ownerUserId);

        if (targetUserId === ownerUserId) {
            throw new AppError("You cannot share a task with yourself", 400);
        }

        await this.ensureIsContact(ownerUserId, targetUserId);
        await this.ensureShareTargetExists(targetUserId);

        const existing = await this.db
            .select({ permission: users_own_tasks.permission })
            .from(users_own_tasks)
            .where(
                and(
                    eq(users_own_tasks.task_id, taskId),
                    eq(users_own_tasks.user_id, targetUserId),
                ),
            )
            .limit(1);

        if (existing.length > 0 && existing[0].permission === "owner") {
            throw new AppError("Cannot change owner permissions", 400);
        }

        if (existing.length > 0) {
            await this.db
                .update(users_own_tasks)
                .set({ permission })
                .where(
                    and(
                        eq(users_own_tasks.task_id, taskId),
                        eq(users_own_tasks.user_id, targetUserId),
                    ),
                );
            return;
        }

        await this.db.insert(users_own_tasks).values({
            user_id: targetUserId,
            task_id: taskId,
            permission,
        });
    }

    public async listTaskShares(
        taskId: number,
        ownerUserId: number,
    ): Promise<TaskShareRow[]> {
        await this.ensureTaskOwnerAccess(taskId, ownerUserId);

        const rows = await this.db
            .select({
                id: users.id,
                email: users.email,
                first_name: users.first_name,
                last_name: users.last_name,
                permission: users_own_tasks.permission,
            })
            .from(users_own_tasks)
            .innerJoin(users, eq(users.id, users_own_tasks.user_id))
            .where(eq(users_own_tasks.task_id, taskId));

        return rows;
    }

    public async revokeTaskShare(
        taskId: number,
        ownerUserId: number,
        targetUserId: number,
    ): Promise<void> {
        await this.ensureTaskOwnerAccess(taskId, ownerUserId);

        if (targetUserId === ownerUserId) {
            throw new AppError("You cannot revoke the owner", 400);
        }

        const existing = await this.db
            .select({ permission: users_own_tasks.permission })
            .from(users_own_tasks)
            .where(
                and(
                    eq(users_own_tasks.task_id, taskId),
                    eq(users_own_tasks.user_id, targetUserId),
                ),
            )
            .limit(1);

        if (existing.length === 0) {
            throw new AppError("Share not found", 404);
        }

        if (existing[0].permission === "owner") {
            throw new AppError("You cannot revoke the owner", 400);
        }

        await this.db
            .delete(users_own_tasks)
            .where(
                and(
                    eq(users_own_tasks.task_id, taskId),
                    eq(users_own_tasks.user_id, targetUserId),
                ),
            );
    }
}
