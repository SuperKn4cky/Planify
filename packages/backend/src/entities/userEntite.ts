import { z } from "zod";

const nameRegex = /^[\p{L}\p{M}' -]+$/u;

export const userSchema = z.object({
    id: z.number().optional(),
    email: z
        .email({ message: "Invalid email format" })
        .min(5, { message: "Email must be at least 5 characters long" })
        .max(60, { message: "Email must be at most 60 characters long" }),
    first_name: z
        .string()
        .min(2, { message: "First name must be at least 2 characters long" })
        .max(30, { message: "First name must be at most 30 characters long" })
        .regex(nameRegex, {
            message:
                "First name must be only letters, spaces, apostrophes or -",
        }),
    last_name: z
        .string()
        .min(2, { message: "Last name must be at least 2 characters long" })
        .max(30, { message: "Last name must be at most 30 characters long" })
        .regex(nameRegex, {
            message: "Last name must be only letters, spaces, apostrophes or -",
        }),
    revocation_timestamp: z.date().optional(),
});

export const UserWithPasswordSchema = userSchema.extend({
    password: z
        .string()
        .min(12, { message: "Password must be at least 12 characters long" })
        .max(255, { message: "Password must be at most 255 characters long" })
        .regex(/[A-Z]/, {
            message: "Password must contain at least one uppercase letter",
        })
        .regex(/[a-z]/, {
            message: "Password must contain at least one lowercase letter",
        })
        .regex(/\d/, { message: "Password must contain at least one digit" })
        .regex(/[@$!%*?&]/, {
            message:
                "Password must contain at least one special character (@$!%*?&)",
        }),
});

export class User {
    public id?: number;
    public email!: string;
    public first_name!: string;
    public last_name!: string;
    public revocation_timestamp?: Date;

    public constructor(data: unknown) {
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
    public password: string;

    public constructor(data: unknown) {
        const result = UserWithPasswordSchema.safeParse(data);
        if (!result.success) {
            throw result.error;
        }
        super(result.data);
        this.password = result.data.password;
    }
}
