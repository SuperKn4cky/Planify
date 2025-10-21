import { eq } from "drizzle-orm";
import { users } from "../db/schema.js";
import { UserWithPassword } from "../entities/userEntite.js";
import type { DB } from "../db/drizzle.js";

export default class UserService {
    private db: DB;

    constructor(db: DB) {
        this.db = db;
    }

    public async createUser(user: UserWithPassword): Promise<any> {
        const result = await this.db.insert(users).values(user).returning();
        if (!result) {
            throw new Error("User creation failed");
        }
        return result;
    }

    public async getUserByID(id: number): Promise<any> {
        const result = await this.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (result.length === 0) {
            throw new Error("User not found");
        }

        return result[0];
    }
}
