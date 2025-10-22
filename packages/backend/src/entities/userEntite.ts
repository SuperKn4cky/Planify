import { z } from "zod";
import AppError from "../middlewares/errorHandler.js";

export const userSchema = z.object({
    id: z.number().optional(),
    email: z
        .email({ message: "Invalid email address" })
        .min(5, { message: "Email must be at least 5 characters long" })
        .max(60, { message: "Email must be at most 60 characters long" }),
    first_name: z
        .string()
        .min(2, { message: "First name must be at least 2 characters long" })
        .max(30, { message: "First name must be at most 30 characters long" })
        .regex(/^[a-zA-Z'-]+$/, { message: "First name must be only letters" }),
    last_name: z
        .string()
        .min(2, { message: "Last name must be at least 2 characters long" })
        .max(30, { message: "Last name must be at most 30 characters long" })
        .regex(/^[a-zA-Z'-]+$/, { message: "Last name must be only letters" }),
    revocation_timestamp: z.date().optional(),
});

export const UserWithPasswordSchema = userSchema.extend({
    password: z
        .string()
        .min(12, { message: "Password must be at least 12 characters long" })
        .max(255, { message: "Password must be at most 255 characters long" }),
});

export class User {
    id?: number;
    email!: string;
    first_name!: string;
    last_name!: string;
    revocation_timestamp?: Date;

    constructor(data: unknown) {
        const result = userSchema.safeParse(data);
        if (!result.success) {
            throw result.error;
        }
        this.id = result.data.id;
        this.email = result.data.email;
        this.first_name = result.data.first_name;
        this.last_name = result.data.last_name;
        this.revocation_timestamp = result.data.revocation_timestamp;
    }

    public toPublic() {
        return {
            email: this.email,
            first_name: this.first_name,
            last_name: this.last_name,
        };
    }
}

export class UserWithPassword extends User {
    password: string;

    constructor(data: unknown) {
        const result = UserWithPasswordSchema.safeParse(data);
        if (!result.success) {
            throw result.error;
        }
        super(result.data);
        this.password = result.data.password;
    }
}
