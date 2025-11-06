import { NextFunction, Request, Response } from "express";
import AppError from "../middlewares/errorHandler.js";
import TaskService from "../services/taskService.js";
import { NewTask } from "../DTO/taskDTO.js";

export default class TaskController {
    private taskService: TaskService;

    public constructor(taskService: TaskService) {
        this.taskService = taskService;
    }

    public async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new AppError("User not authenticated", 401);
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
}
