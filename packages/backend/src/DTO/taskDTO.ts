import { z } from "zod";

export const statusValues = ["todo", "doing", "done"] as const;

export const baseTaskSchema = z.object({
    id: z.number().optional(),
    title: z
        .string()
        .min(1, { message: "Title is required" })
        .max(60, { message: "Title must be at most 60 characters long" }),
    description: z
        .string()
        .max(255, {
            message: "Description must be at most 255 characters long",
        })
        .optional()
        .nullable(),
    folder_id: z.number().int().positive().optional().nullable(),
    responsible_user: z.number().int().positive().optional().nullable(),
    status: z.enum(statusValues).optional().default("todo"),
    priority: z
        .number()
        .int()
        .min(1, { message: "Priority must be >= 1" })
        .max(3, { message: "Priority must be <= 3" })
        .optional()
        .default(1),
});

export const taskSchema = baseTaskSchema.extend({
    due_date: z.coerce.date().optional().nullable(),
});

export const newTaskSchema = baseTaskSchema.omit({ id: true }).extend({
    due_date: z.coerce
        .date()
        .refine(
            (date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date >= today;
            },
            {
                message: "Due date cannot be in the past",
            },
        )
        .optional()
        .nullable(),
});

export class Task {
    public id?: number;
    public title!: string;
    public description?: string | null;
    public folder_id?: number | null;
    public responsible_user?: number | null;
    public due_date?: Date | null;
    public status?: (typeof statusValues)[number];
    public priority?: number;

    public constructor(data: unknown, skipParse = false) {
        if (skipParse) {
            Object.assign(this, data);
            return;
        }
        const parsed = taskSchema.safeParse(data);
        if (!parsed.success) throw parsed.error;
        Object.assign(this, parsed.data);
    }

    public toPublic() {
        return {
            id: this.id,
            title: this.title,
            description: this.description ?? null,
            folder_id: this.folder_id ?? null,
            responsible_user: this.responsible_user ?? null,
            due_date: this.due_date ?? null,
            status: this.status ?? "todo",
            priority: this.priority ?? 1,
        };
    }
}

export class NewTask extends Task {
    public constructor(data: unknown) {
        const parsed = newTaskSchema.safeParse(data);
        if (!parsed.success) throw parsed.error;
        super(parsed.data, true);
    }
}

export const updateTaskSchema = newTaskSchema.partial();

export class UpdateTask {
    public title?: string;
    public description?: string | null;
    public folder_id?: number | null;
    public responsible_user?: number | null;
    public due_date?: Date | null;
    public status?: (typeof statusValues)[number];
    public priority?: number;

    public constructor(data: unknown) {
        const parsed = updateTaskSchema.safeParse(data);
        if (!parsed.success) {
            throw parsed.error;
        }
        Object.assign(this, parsed.data);
    }
}
