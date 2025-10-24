import { eq } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm";
import { users } from "../db/schema.js";
import { User, UserWithPassword } from "../entities/userEntite.js";
import type { DB } from "../db/drizzle.js";
import AppError from "../middlewares/errorHandler.js";
import AuthService from "./authService.js";
import argon2 from "argon2";

export default class UserService {
    private db: DB;
    private authService!: AuthService;

    public constructor(db: DB) {
        this.db = db;
    }
    public setAuthService(authService: AuthService): void {
        this.authService = authService;
    }

    public async createUser(
        user: UserWithPassword,
    ): Promise<User & { token: string }> {
        try {
            const hash = await argon2.hash(user.password, {
                type: argon2.argon2id,
            });
            user.password = hash;
            const insertedUser = await this.db
                .insert(users)
                .values(user)
                .returning();
            if (!insertedUser) {
                throw new AppError("User creation failed", 500);
            }

            const token = await this.authService.generateToken(
                { user_id: insertedUser[0].id },
                "7d",
            );
            const userInstance = new User(insertedUser[0]);
            return Object.assign(userInstance, { token });
        } catch (error) {
            if (
                error instanceof DrizzleQueryError &&
                (error as any).cause.code
            ) {
                throw new AppError("This email is already in use.", 400);
            }
            throw new AppError("User creation failed", 500);
        }
    }

    public async loginUser(email: string, password: string): Promise<string> {
        try {
            const result = await this.db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);

            if (result.length === 0) {
                throw new AppError("Invalid email or password", 401);
            }

            const user = result[0];

            const isValid = user
                ? await argon2.verify(user.password, password)
                : false;

            if (!isValid) {
                throw new AppError("Invalid email or password", 401);
            }

            const token = await this.authService.generateToken(
                { user_id: user.id },
                "7d",
            );
            return token;
        } catch {
            throw new AppError("Login failed", 500);
        }
    }

    public async revokeTokens(user_id: number): Promise<void> {
        try {
            const now = new Date();
            await this.db
                .update(users)
                .set({ revocation_timestamp: now })
                .where(eq(users.id, user_id));
        } catch {
            throw new AppError("Failed to revoke tokens", 500);
        }
    }

    public async getRevocationTimestamp(user_id: number): Promise<Date> {
        try {
            const result = await this.db
                .select({
                    revocation_timestamp: users.revocation_timestamp,
                })
                .from(users)
                .where(eq(users.id, user_id))
                .limit(1);

            if (result.length === 0) {
                throw new AppError("User not found", 404);
            }

            return new Date(result[0].revocation_timestamp);
        } catch {
            throw new AppError("Failed to retrieve revocation timestamp", 500);
        }
    }

    public async getUserByID(id: number): Promise<User> {
        try {
            const result = await this.db
                .select()
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (result.length === 0) {
                throw new AppError("User not found", 404);
            }
            const userInstance = new User(result[0]);

            return userInstance;
        } catch {
            throw new AppError("Failed to retrieve user", 500);
        }
    }

    public async deleteUserByID(id: number): Promise<void> {
        try {
            const result = await this.db
                .delete(users)
                .where(eq(users.id, id))
                .returning();

            if (result.length === 0) {
                throw new AppError("User not found", 404);
            }
        } catch {
            throw new AppError("Failed to delete user", 500);
        }
    }
}
