import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import startDatabase, { DB } from "./db/drizzle.js";
import { Pool } from "pg";
import Routes from "./routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import generateJwtSecret from "./config/jwt.js";

export class WebApp {
    private app: express.Application;
    private port: number;
    private databaseUrl?: string;
    private db!: DB;
    private pool!: Pool;
    private jwtSecret?: string;
    private frontendUrl?: string;
    public nodeEnv: string;

    public constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
        this.port = parseInt(process.env.PORT || "4000", 10);
        this.databaseUrl = process.env.DATABASE_URL || undefined;
        this.frontendUrl = "http://localhost:3000";
        this.nodeEnv = process.env.NODE_ENV || "development";
        this.jwtSecret = process.env.JWT_SECRET || undefined;

        this.app = express();
        this.app.use(cors(corsOptions(this.frontendUrl)));
        this.app.options("/*splat", cors(corsOptions(this.frontendUrl)));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());
    }

    public async init(): Promise<void> {
        if (!this.jwtSecret) {
            this.jwtSecret = generateJwtSecret(this.nodeEnv);
        }
        const { db, pool } = await startDatabase(this.databaseUrl);
        this.db = db;
        this.pool = pool;
        const routes = new Routes(this.app, this.db, this.jwtSecret);

        await routes.register();
        this.app.use(errorHandler);
    }

    public run(): void {
        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });
    }

    /**
     * Need it for testing with Supertest.
     */
    public getApp(): express.Application {
        return this.app;
    }

    public getDb(): DB {
        return this.db;
    }

    public getPool(): Pool {
        return this.pool;
    }

    public async close(): Promise<void> {
        await this.pool.end();
        console.log("Database pool has been closed.");
    }
}

async function main() {
    const webApp = new WebApp();
    await webApp.init();
    webApp.run();
}

// Prevents the server from starting when the module is imported for testing.
if (process.env.NODE_ENV !== "test") {
    main().catch((error) => {
        console.error("Fatal error starting application:", error);
        process.exit(1);
    });
}
