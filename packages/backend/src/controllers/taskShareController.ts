import type { NextFunction, Request, Response } from "express";
import AppError from "../middlewares/errorHandler.js";
import TaskService from "../services/taskService.js";

type SharePermission = "read" | "write";

export default class TaskShareController {
    private taskService: TaskService;

    public constructor(taskService: TaskService) {
        this.taskService = taskService;
    }

    public async listShares(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const taskId = Number.parseInt(req.params.id, 10);
            if (!Number.isFinite(taskId) || taskId <= 0) {
                throw new AppError("Invalid task id", 400);
            }

            const data = await this.taskService.listTaskShares(
                taskId,
                req.user.id,
            );
            res.status(200).json({ data });
        } catch (error) {
            next(error);
        }
    }

    public async addShare(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const taskId = Number.parseInt(req.params.id, 10);
            if (!Number.isFinite(taskId) || taskId <= 0) {
                throw new AppError("Invalid task id", 400);
            }

            const rawUserId = req.body?.userId;
            const rawPermission = req.body?.permission;

            const userId = Number.parseInt(String(rawUserId), 10);
            if (!Number.isFinite(userId) || userId <= 0) {
                throw new AppError("Invalid userId", 400);
            }

            if (rawPermission !== "read" && rawPermission !== "write") {
                throw new AppError("Invalid permission", 400);
            }

            await this.taskService.shareTask(
                taskId,
                req.user.id,
                userId,
                rawPermission as SharePermission,
            );

            res.status(201).json({ message: "Task shared successfully" });
        } catch (error) {
            next(error);
        }
    }

    public async deleteShare(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const taskId = Number.parseInt(req.params.id, 10);
            if (!Number.isFinite(taskId) || taskId <= 0) {
                throw new AppError("Invalid task id", 400);
            }

            const targetUserId = Number.parseInt(req.params.userId, 10);
            if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
                throw new AppError("Invalid userId", 400);
            }

            await this.taskService.revokeTaskShare(
                taskId,
                req.user.id,
                targetUserId,
            );

            res.status(200).json({
                message: "Task share revoked successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}
