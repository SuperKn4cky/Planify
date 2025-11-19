import { NextFunction, Request, Response } from "express";
import AppError from "../middlewares/errorHandler.js";
import TaskService from "../services/taskService.js";
import { NewTask, UpdateTask } from "../DTO/taskDTO.js";

export default class TaskController {
    private taskService: TaskService;

    public constructor(taskService: TaskService) {
        this.taskService = taskService;
    }

    public async createTask(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id)
                throw new AppError("User not authenticated", 401);
            const input = new NewTask({
                title: req.body.title ?? "",
                description: req.body.description,
                folder_id: req.body.folder_id,
                responsible_user: req.body.responsible_user,
                due_date: req.body.due_date,
                status: req.body.status,
                priority: req.body.priority,
            });
            const task = await this.taskService.createTask(input, req.user.id);
            res.status(201).json({
                message: "Task created successfully",
                data: task.toPublic(),
            });
        } catch (error) {
            next(error);
        }
    }

    public async deleteTask(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id)
                throw new AppError("User not authenticated", 401);

            const rawId = req.params.id;
            const id = Number.parseInt(rawId, 10);
            if (!Number.isFinite(id) || id <= 0) {
                throw new AppError("Invalid task id", 400);
            }

            await this.taskService.deleteTaskByID(id, req.user.id);
            res.status(200).json({ message: "Task deleted successfully" });
        } catch (error) {
            next(error);
        }
    }

    public async updateTask(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const rawId = req.params.id;
            const id = Number.parseInt(rawId, 10);
            if (!Number.isFinite(id) || id <= 0) {
                throw new AppError("Invalid task id", 400);
            }

            const input = new UpdateTask({
                title: req.body.title,
                description: req.body.description,
                folder_id: req.body.folder_id,
                responsible_user: req.body.responsible_user,
                due_date: req.body.due_date,
                status: req.body.status,
                priority: req.body.priority,
            });

            const task = await this.taskService.updateTaskByID(
                id,
                req.user.id,
                input,
            );

            res.status(200).json({
                message: "Task updated successfully",
                data: task.toPublic(),
            });
        } catch (error) {
            next(error);
        }
    }

    public async startEditing(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id)
                throw new AppError("User not authenticated", 401);

            const id = Number.parseInt(req.params.id, 10);
            if (!Number.isFinite(id) || id <= 0) {
                throw new AppError("Invalid task id", 400);
            }

            await this.taskService.startEditing(id, req.user.id);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    }

    public async stopEditing(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id)
                throw new AppError("User not authenticated", 401);

            const id = Number.parseInt(req.params.id, 10);
            if (!Number.isFinite(id) || id <= 0) {
                throw new AppError("Invalid task id", 400);
            }

            await this.taskService.stopEditing(id, req.user.id);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    }

    public async getTask(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const rawId = req.params.id;
            const id = Number.parseInt(rawId, 10);
            if (!Number.isFinite(id) || id <= 0) {
                throw new AppError("Invalid task id", 400);
            }

            const task = await this.taskService.getTaskByID(id, req.user.id);

            res.status(200).json({
                data: task.toPublic(),
            });
        } catch (error) {
            next(error);
        }
    }

    public async listTasks(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const rawPage = req.query.page as string | undefined;
            const rawPageSize = req.query.page_size as string | undefined;

            const page = Number.parseInt(rawPage ?? "1", 10);
            const pageSize = Number.parseInt(rawPageSize ?? "15", 10);

            if (!Number.isFinite(page) || page <= 0) {
                throw new AppError("Invalid page parameter", 400);
            }

            if (!Number.isFinite(pageSize) || pageSize <= 0 || pageSize > 100) {
                throw new AppError("Invalid page_size parameter", 400);
            }

            const rawStatus = (req.query.status as string | undefined) ?? "all";
            const rawSort = (req.query.sort as string | undefined) ?? "recent";
            const rawScope = (req.query.scope as string | undefined) ?? "all";
            const rawQuery = (req.query.q as string | undefined)?.trim() ?? "";

            const status =
                rawStatus === "todo" ||
                rawStatus === "doing" ||
                rawStatus === "done"
                    ? rawStatus
                    : "all";

            const sort = rawSort === "oldest" ? "oldest" : "recent";

            const scope =
                rawScope === "mine" || rawScope === "shared" ? rawScope : "all";

            const query = rawQuery.length > 0 ? rawQuery : null;

            const { items, total } = await this.taskService.getTasksForUser(
                req.user.id,
                page,
                pageSize,
                {
                    status,
                    sort,
                    scope,
                    query,
                },
            );

            const totalPages = Math.ceil(total / pageSize);

            res.status(200).json({
                items,
                page,
                pageSize,
                total,
                totalPages,
            });
        } catch (error) {
            next(error);
        }
    }
}
