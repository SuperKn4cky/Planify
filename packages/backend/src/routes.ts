import express, { Request, Response } from "express";
import { DB } from "./db/drizzle.js";
import AuthMiddleware from "./middlewares/authMiddleware.js";
import AuthService from "./services/authService.js";
import UserController from "./controllers/userController.js";
import UserService from "./services/userService.js";
import TaskController from "./controllers/taskController.js";
import TaskService from "./services/taskService.js";
import FolderController from "./controllers/folderController.js";
import FolderService from "./services/folderService.js";

export default class Routes {
    private app: express.Application;
    private db: DB;
    private jwtSecret: string;

    private authMiddleware: AuthMiddleware;
    private authService: AuthService;

    private userController: UserController;
    private userService: UserService;

    private taskService: TaskService;
    private taskController: TaskController;

    private folderService: FolderService;
    private folderController: FolderController;

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

        this.taskService = new TaskService(this.db);
        this.taskController = new TaskController(this.taskService);

        this.folderService = new FolderService(this.db);
        this.folderController = new FolderController(this.folderService);
    }

    public register(): void {
        // User routes
        this.userRoutes();

        // Task routes
        this.tasksRoutes();

        // Folder routes
        this.foldersRoutes();

        // Health check endpoint
        this.app.get("/health", (req: Request, res: Response) => {
            res.status(200).json({ status: "OK" });
        });

        // 404 handler
        this.app.use((req: Request, res: Response) => {
            console.log("404 Not Found:", req.originalUrl);
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
            this.userController.logoutUser.bind(this.userController),
        );

        this.app.post(
            "/auth/logout-all",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.userController.logoutAllTokens.bind(this.userController),
        );

        this.app.get(
            "/users/me",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.userController.getUser.bind(this.userController),
        );

        this.app.put(
            "/users/me",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.userController.updateUser.bind(this.userController),
        );

        this.app.delete(
            "/users/me",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.userController.deleteUser.bind(this.userController),
        );
    }

    private tasksRoutes(): void {
        this.app.post(
            "/tasks",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.taskController.createTask.bind(this.taskController),
        );

        this.app.get(
            "/tasks",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.taskController.listTasks.bind(this.taskController),
        );

        this.app.get(
            "/tasks/:id",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.taskController.getTask.bind(this.taskController),
        );

        this.app.put(
            "/tasks/:id",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.taskController.updateTask.bind(this.taskController),
        );

        this.app.post(
            "/tasks/:id/editing",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.taskController.startEditing.bind(this.taskController),
        );

        this.app.delete(
            "/tasks/:id/editing",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.taskController.stopEditing.bind(this.taskController),
        );

        this.app.delete(
            "/tasks/:id",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.taskController.deleteTask.bind(this.taskController),
        );
    }

    private foldersRoutes(): void {
        this.app.post(
            "/folders",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.folderController.createFolder.bind(this.folderController),
        );

        this.app.get(
            "/folders",
            this.authMiddleware.isAuthenticated.bind(this.authMiddleware),
            this.folderController.listFolders.bind(this.folderController),
        );
    }
}
