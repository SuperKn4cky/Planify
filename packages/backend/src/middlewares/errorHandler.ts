import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export default class AppError extends Error {
    public status: number;
    public details?: any;

    public constructor(message: string, status: number, details?: any) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

export function errorHandler(
    error: any,
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    if (error instanceof ZodError) {
        const { fieldErrors, formErrors } = z.flattenError(error);
        return res.status(422).json({
            error: {
                message: "Validation failed",
                messages: error.issues.map((e) => e.message),
                fields: fieldErrors,
                form: formErrors,
            },
        });
    }

    if (error instanceof AppError) {
        return res.status(error.status).json({
            error: {
                message: error.message,
                details: error.details,
            },
        });
    }

    console.error("UNHANDLED ERROR:", error);
    // Pour toutes les autres erreurs, renvoyer une réponse 500 générique
    return res
        .status(500)
        .json({ error: { message: "Internal Server Error" } });
}
