import { NextFunction, Request, Response } from "express";
import { UserWithPassword, User } from "../entities/userEntite.js";
import AppError from "../middlewares/errorHandler.js";
import UserService from "../services/userService.js";

const isProduction = process.env.NODE_ENV === "production";

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
            const newUser = new UserWithPassword({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email,
                password: req.body.password,
            });
            const user = await this.userService.createUser(newUser);
            res.cookie("auth", "Bearer " + user.token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "lax",
                path: "/",
            });
            res.status(201).json({
                message: "User created successfully",
                data: user.toPublic(),
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
            res.cookie("auth", "Bearer " + token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "lax",
                path: "/",
            });
            res.status(200).json({
                message: "Login successful",
            });
        } catch (error) {
            next(error);
        }
    }

    public async logoutUser(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user || !req.user.id) {
                throw new AppError("User not authenticated", 401);
            }
            await this.userService.revokeTokens(req.user.id);
            res.clearCookie("auth", { path: "/" });
            res.status(200).json({
                message: "Logout successful",
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
            res.status(200).json(user.toPublic());
        } catch (error) {
            next(error);
        }
    }

    public async deleteUserByID(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                throw new AppError("Invalid or missing user id", 400);
            }
            await this.userService.deleteUserByID(Number(id));
            res.status(200).json({
                message: "User deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}
