import { Request, Response, NextFunction } from "express";
import AuthService from "../services/authService.js";
import AppError from "./errorHandler.js";

export default class AuthMiddleware {
    private authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    public async isAuthenticated(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        let token: string | undefined;
        const authCookie = req.cookies?.auth;

        if (authCookie?.startsWith("Bearer ")) {
            token = authCookie.replace("Bearer ", "");
        }

        if (!token) {
            res.status(401).json({ error: "Token is missing" });
            return;
        }

        try {
            const payload = await this.authService.verifyToken(token);
            req.user = { id: payload.user_id as number };

            const isRevoked = await this.authService.verifyRevocation(payload);
            if (isRevoked) {
                res.status(401).json({ error: "Token has been revoked" });
                return;
            }

            next();
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.status).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Internal server error" });
            }
        }
    }
}
