import { Request, Response, NextFunction } from "express";
import AuthService from "../services/authService.js";

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
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ error: "User not authenticated" });
            return;
        }

        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            const payload = await this.authService.verifyToken(token);
            req.user = { id: payload.user_id as number };

            const isRevoked = await this.authService.verifyRevocation(payload);
            if (isRevoked) {
                res.status(401).json({ error: "Token has been revoked" });
                return;
            }

            next();
        } catch {
            res.status(401).json({ error: "Invalid or expired token" });
        }
    }

    public async authorizeUserId(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const paramUserId = req.params.id;

        const loggedUserId = req.user?.id?.toString();

        if (paramUserId !== loggedUserId) {
            res.status(403).json({ error: "Forbidden: Access denied" });
            return;
        }

        next();
    }
}
