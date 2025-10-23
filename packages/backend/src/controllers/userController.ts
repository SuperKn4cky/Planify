import { NextFunction, Request, Response } from "express";
import { UserWithPassword, User } from "../entities/userEntite.js";
import AppError from "../middlewares/errorHandler.js";
import UserService from "../services/userService.js";

export default class UserController {
    private userService: UserService;

    public constructor(userService: UserService) {
        this.userService = userService;
    }

    public async createUser(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const newUser = new UserWithPassword(req.body);
            const user = await this.userService.createUser(newUser);
            res.json({
                message: "User created successfully",
                data: user.toPublic(),
                token: user.token,
            });
        } catch (error) {
            next(error);
        }
    }

    public async loginUser(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                throw new AppError("Email and password are required", 400);
            }
            const token = await this.userService.loginUser(email, password);
            res.json({
                message: "Login successful",
                token: token,
            });
        } catch (error) {
            next(error);
        }
    }

    public async getUserByID(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                throw new AppError("Invalid or missing user id", 400);
            }
            const user = await this.userService.getUserByID(Number(id));
            res.json(user.toPublic());
        } catch (error) {
            next(error);
        }
    }
}
