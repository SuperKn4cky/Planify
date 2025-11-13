import { NextFunction, Request, Response } from "express";
import { UserWithPassword, userSchema, User } from "../DTO/userDTO.js";
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
            const ACCESS_TTL_SEC = 7 * 24 * 60 * 60 * 1000;
            res.cookie("auth", "Bearer " + user.token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "lax",
                path: "/",
                maxAge: ACCESS_TTL_SEC,
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
            const ACCESS_TTL_SEC = 7 * 24 * 60 * 60 * 1000;
            res.cookie("auth", "Bearer " + token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "lax",
                path: "/",
                maxAge: ACCESS_TTL_SEC,
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
            res.clearCookie("auth", { path: "/" });
            res.status(200).json({
                message: "Logout successful",
            });
        } catch (error) {
            next(error);
        }
    }

    public async logoutAllTokens(
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
                message: "All tokens revoked successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    public async getUser(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }
            const user = await this.userService.getUserByID(req.user.id);
            res.status(200).json(user.toPublic());
        } catch (error) {
            next(error);
        }
    }

    public async updateUser(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }
            const updatedData: Partial<User> = {
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email,
            };
            const partialSchema = userSchema
                .pick({ first_name: true, last_name: true, email: true })
                .partial();
            const parsed = partialSchema.parse(updatedData);

            const updatedUser = await this.userService.updateUserByID(
                req.user.id,
                parsed,
            );
            res.status(204).json({
                message: "User updated successfully",
                data: updatedUser.toPublic(),
            });
        } catch (error) {
            next(error);
        }
    }

    public async deleteUser(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new AppError("User not authenticated", 401);
            }
            await this.userService.deleteUserByID(req.user.id);
            res.clearCookie("auth", { path: "/" });
            res.status(200).json({
                message: "User deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}
