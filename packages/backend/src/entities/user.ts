import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "../db/schema";

export const userInsertSchema = createInsertSchema(users);
export const userSelectSchema = createSelectSchema(users).omit({
    password: true,
});

export class User {
    email: string;
    first_name: string;
    last_name: string;
    password?: string;

    constructor(data: unknown, mode: "insert" | "select" = "insert") {
        if (mode === "insert") {
            const result = userInsertSchema.safeParse(data);
            if (!result.success) throw new Error("Validation failed");
            this.email = result.data.email;
            this.first_name = result.data.first_name;
            this.last_name = result.data.last_name;
            this.password = result.data.password;
        } else {
            const result = userSelectSchema.safeParse(data);
            if (!result.success) throw new Error("Validation failed");
            this.email = result.data.email;
            this.first_name = result.data.first_name;
            this.last_name = result.data.last_name;
        }
    }

    public toPublic() {
        return {
            email: this.email,
            first_name: this.first_name,
            last_name: this.last_name,
        };
    }
}
