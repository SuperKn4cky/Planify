import { z } from "zod";

export const statusValues = ["todo", "doing", "done"] as const;
export const priorityValues = [1, 2, 3] as const;

export const taskSchema = z.object({
    title: z
        .string()
        .min(1, { message: "Le titre est requis" })
        .max(60, { message: "Le titre ne doit pas dépasser 60 caractères" }),
    description: z
        .string()
        .max(255, {
            message: "La description ne doit pas dépasser 255 caractères",
        })
        .optional(),
    due_date: z
        .string()
        .optional()
        .refine(
            (date) => {
                if (!date) return true;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(date) >= today;
            },
            { message: "La date d'échéance ne peut pas être dans le passé" },
        ),
    status: z.enum(statusValues).optional(),
    priority: z.number().int().min(1).max(3).optional(),
});
