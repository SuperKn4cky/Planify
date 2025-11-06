import { z } from "zod";

export const statusValues = ["todo", "doing", "done"] as const;

export const taskSchema = z.object({
    id: z.number().optional(),
    title: z
        .string()
        .min(1, { message: "Title is required" })
        .max(60, { message: "Title must be at most 60 characters long" }),
    description: z.string().max(255, { message: "Description must be at most 255 characters long" }).optional().nullable(),
    folder_id: z.number().int().positive().optional().nullable(),
    responsible_user: z.number().int().positive().optional().nullable(),
    due_date: z.coerce.date().optional().nullable(),
    status: z.enum(statusValues).optional().default("todo"),
    priority: z.number().int().min(1, { message: "Priority must be >= 1" }).max(5, { message: "Priority must be <= 5" }).optional().default(1),
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

    public constructor(data: unknown) {
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
            due_date: this.due_date ? new Date(this.due_date) : null,
            status: this.status ?? "todo",
            priority: this.priority ?? 1,
        };
    }
}

export const newTaskSchema = taskSchema.omit({ id: true });

export class NewTask extends Task {
    public constructor(data: unknown) {
        console.log("data", data);
        const parsed = newTaskSchema.safeParse(data);
        if (!parsed.success) throw parsed.error;
        super(parsed.data);
    }
}
