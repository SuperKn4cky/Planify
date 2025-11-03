import express, { Request, Response } from "express";
import { DB } from "./db/drizzle.js";
import AuthMiddleware from "./middlewares/authMiddleware.js";
import AuthService from "./services/authService.js";
import UserController from "./controllers/userController.js";
import UserService from "./services/userService.js";

export default class Routes {
    private app: express.Application;
    private db: DB;
    private jwtSecret: string;

    private authMiddleware: AuthMiddleware;
    private authService: AuthService;

    private userController: UserController;
    private userService: UserService;

    public constructor(app: express.Application, db: DB, jwtSecret: string) {
        this.app = app;
        this.db = db;
        this.jwtSecret = jwtSecret;

        // Instancier les services sans leurs dépendances circulaires
        this.authService = new AuthService(this.jwtSecret);
        this.userService = new UserService(this.db);

        // Injecter les dépendances mutuelles
        this.authService.setUserService(this.userService);
        this.userService.setAuthService(this.authService);

        this.authMiddleware = new AuthMiddleware(this.authService);

        this.userController = new UserController(this.userService);
    }

    public register(): void {
        // User routes
        this.userRoutes();

        // Health check endpoint
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

    private userRoutes(): void {
        this.app.post(
            "/auth/register",
            this.userController.createUser.bind(this.userController),
        );

        this.app.post(
            "/auth/login",
            this.userController.loginUser.bind(this.userController),
        );

        this.app.post(
            "/auth/logout",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.userController.logoutUser.bind(this.userController),
        );

        this.app.post(
            "/auth/logout-all",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.userController.logoutAllTokens.bind(this.userController),
        );

        this.app.get(
            "/users/:id",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.authMiddleware.authorizeUserId.bind(this.authMiddleware),
            this.userController.getUserByID.bind(this.userController),
        );

        this.app.put(
            "/users/:id",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.authMiddleware.authorizeUserId.bind(this.authMiddleware),
            this.userController.updateUserByID.bind(this.userController),
        );

        this.app.delete(
            "/users/:id",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.authMiddleware.authorizeUserId.bind(this.authMiddleware),
            this.userController.deleteUserByID.bind(this.userController),
        );
    }
}
