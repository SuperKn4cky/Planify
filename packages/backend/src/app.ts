import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import startDatabase, { DB } from "./db/drizzle.js";
import UserController from "./controllers/user.js";
import Routes from "./routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import generateJwtSecret from "./config/jwt.js";
import UserService from "./services/userService.js";

export class WebApp {
    private app: express.Application;
    private port: number;
    private databaseUrl?: string;
    private db!: DB;
    private jwtSecret?: string;
    private frontendUrl?: string;
    public nodeEnv: string;

    constructor() {
        dotenv.config();
        this.port = parseInt(process.env.PORT || "4000", 10);
        this.databaseUrl = process.env.DATABASE_URL || undefined;
        this.frontendUrl = process.env.FRONTEND_URL || undefined;
        this.nodeEnv = process.env.NODE_ENV || "development";
        this.jwtSecret = process.env.JWT_SECRET || undefined;

        this.app = express();
        this.app.use(cors(corsOptions));
        this.app.options("/*splat", cors(corsOptions));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());
    }

    public async init(): Promise<void> {
        if (!this.jwtSecret) {
            this.jwtSecret = generateJwtSecret(this.nodeEnv);
        }

        try {
            this.db = await startDatabase(this.databaseUrl);
        } catch (error) {
            console.error("Failed to initialize database:", error);
            throw error;
        }
        const userService = new UserService(this.db);
        const userController = new UserController(userService);
        const routes = new Routes(this.app, { userController });

        routes.register();
        this.app.use(errorHandler);
    }

    public run(): void {
        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });
    }
}

async function main() {
    const webApp = new WebApp();
    await webApp.init();
    webApp.run();
}

main().catch((error) => {
    console.error("Fatal error starting application:", error);
    process.exit(1);
});
