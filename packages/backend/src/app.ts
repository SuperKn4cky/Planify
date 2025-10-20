import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { corsOptions } from "../config/cors";
import startDatabase from "./db/drizzle";
import UserController from "./controllers/user";
import Routes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import generateJwtSecret from "../config/jwt";

export class webApp {
    private app: express.Application;
    private port: number;
    private databaseUrl: string;
    private db!: Awaited<ReturnType<typeof startDatabase>>;
    private jwtSecret: string;
    private frontendUrl: string;
    public nodeEnv: string;

    constructor() {
        dotenv.config();
        this.port = parseInt(process.env.PORT || "3000", 10);
        this.databaseUrl = process.env.DATABASE_URL || "";
        this.frontendUrl = process.env.FRONTEND_URL || "";
        this.nodeEnv = process.env.NODE_ENV || "development";
        this.jwtSecret = process.env.JWT_SECRET || generateJwtSecret(this.nodeEnv);

        this.app = express();
        this.app.use(cors(corsOptions));
        this.app.options("*", cors(corsOptions));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());
    }

    public async init() : Promise<void> {
        this.db = await startDatabase(this.databaseUrl);
        const routes = new Routes(this.app, { userController: new UserController(this.db) });

        routes.register();
        this.app.use(errorHandler);
    }

    public run() : void {
        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });
    }
}

async function main() {
    const web_app = new webApp();
    await web_app.init();
    web_app.run();
}

main().catch((err) => {
    console.error("Fatal error starting application:", err);
    process.exit(1);
});