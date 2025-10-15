import express, { Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/user";

const controller = new UserController();

export function setRoutes(app: express.Application) {
    app.post("/users", controller.createUser.bind(controller));
    app.get("/users/:id", controller.getUserByID.bind(controller));

    app.use((req: Request, res: Response, next: NextFunction) => {
        res.status(404).json({
            error: "This resource does not exist.",
            req: req.originalUrl,
        });
    });
}

