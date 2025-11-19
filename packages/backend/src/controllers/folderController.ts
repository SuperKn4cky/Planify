import { NextFunction, Request, Response } from "express";
import AppError from "../middlewares/errorHandler.js";
import FolderService from "../services/folderService.js";

export default class FolderController {
    private folderService: FolderService;

    public constructor(folderService: FolderService) {
        this.folderService = folderService;
    }

    public async createFolder(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }

            const rawName = req.body.name;
            if (typeof rawName !== "string") {
                throw new AppError("Folder name must be a string", 400);
            }

            const folder = await this.folderService.createFolder(
                rawName,
                req.user.id,
            );

            res.status(201).json({
                message: "Folder created successfully",
                data: folder,
            });
        } catch (error) {
            next(error);
        }
    }
}
