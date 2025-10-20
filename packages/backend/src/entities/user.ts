import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "../db/schema.js";
import { z } from "zod";

export const userInsertSchema = createInsertSchema(users, {
    email: () =>
        z
            .email({ message: "Invalid email address" })
            .min(5, { message: "Email must be at least 5 characters long" })
            .max(60, { message: "Email must be at most 60 characters long" }),
    first_name: (schema) =>
        schema
            .min(2, {
                message: "First name must be at least 2 characters long",
            })
            .max(30, {
                message: "First name must be at most 30 characters long",
            })
            .regex(/^[a-zA-Z'-]+$/, {
                message: "First name must be only letters",
            }),
    last_name: (schema) =>
        schema
            .min(2, { message: "Last name must be at least 2 characters long" })
            .max(30, {
                message: "Last name must be at most 30 characters long",
            })
            .regex(/^[a-zA-Z'-]+$/, {
                message: "Last name must be only letters",
            }),
    password: (schema) =>
        schema
            .min(12, {
                message: "Password must be at least 12 characters long",
            })
            .max(255, {
                message: "Password must be at most 255 characters long",
            }),
});
export const userSelectSchema = createSelectSchema(users).omit({
    password: true,
});

export class User {
    id?: number;
    email: string;
    first_name: string;
    last_name: string;
    password?: string;
    revocation_timestamp?: Date;

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

            this.id = result.data.id;
            this.email = result.data.email;
            this.first_name = result.data.first_name;
            this.last_name = result.data.last_name;
            this.revocation_timestamp = result.data.revocation_timestamp;
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
