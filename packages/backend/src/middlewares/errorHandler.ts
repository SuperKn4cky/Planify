import { Request, Response } from "express";
import { ZodError } from "zod";

export default class AppError extends Error {
    public statusCode: number;
    public details?: any;

    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

export function errorHandler(error: any, req: Request, res: Response, _next: Function) {
    console.error("Error occurred:", error);
    if (error instanceof ZodError) {
        return res.status(422).json({
            error: {
                messages: error.issues.map((e) => e.message),
            },
        });
    }
    const status = error.status || 500;
    const message = error.message || "An unexpected error occurred";
    res.status(status).json({
        error: {
            message,
            details: error.details || undefined,
        },
    });
}
