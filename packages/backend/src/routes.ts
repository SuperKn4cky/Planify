import express, { Request, Response } from "express";
import UserController from "./controllers/userController.js";

export default class Routes {
    private app: express.Application;
    private userController: UserController;

    constructor(
        app: express.Application,
        controllers: { userController: UserController },
    ) {
        this.app = app;
        this.userController = controllers.userController;
    }

    public register(): void {
        this.app.post(
            "/users",
            this.userController.createUser.bind(this.userController),
        );
        this.app.get(
            "/users/:id",
            this.userController.getUserByID.bind(this.userController),
        );

        this.app.get("/health", (req: Request, res: Response) => {
            res.status(200).json({ status: "OK" });
        });

        // 404 handler
        this.app.use((req: Request, res: Response) => {
            res.status(404).json({
                error: "This resource does not exist.",
                req: req.originalUrl,
            });
        });
    }
}
