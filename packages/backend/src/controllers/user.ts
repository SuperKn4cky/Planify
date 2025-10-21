import { NextFunction, Request, Response } from "express";
import { NewUser, User } from "../entities/user.js";
import AppError from "../middlewares/errorHandler.js";
import UserService from "../services/userService.js";

export default class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const newUser = new NewUser(req.body);
            const row = await this.userService.createUser(newUser);
            const user = new User(row);
            res.json({
                message: "User created successfully",
                data: user.toPublic(),
            });
        } catch (error) {
            next(error);
        }
    }

    public async getUserByID(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                throw new AppError("Invalid or missing user id", 400);
            }
            const row = await this.userService.getUserByID(Number(id));
            const user = new User(row);
            res.json(user.toPublic());
        } catch (error) {
            next(error);
        }
    }
}
