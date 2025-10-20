import { NextFunction, Request, Response } from "express";
import startDatabase from "../db/drizzle.js";
import { User } from "../entities/user.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import AppError from "../middlewares/errorHandler.js";

type DB = Awaited<ReturnType<typeof startDatabase>>;

export default class UserController {
    private db: DB;

    constructor(db: DB) {
        this.db = db;
    }

    public async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = new User(req.body, "insert");
            await this.db.insert(users).values({
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                password: user.password,
            });
            res.json({
                message: "User created successfully",
                data: user.toPublic(),
            });
        } catch (error) {
            next(error);
        }
    }

    public async getUserByID(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                throw new AppError("Invalid or missing user id", 400);
            }
            const result = await this.db
                .select()
                .from(users)
                .where(eq(users.id, Number(id)))
                .limit(1);
            if (result.length === 0) {
                throw new AppError("User not found", 404);
            }
            const user = new User(result[0], "select");
            res.json(user.toPublic());
        } catch (error) {
            next(error);
        }
    }
}
