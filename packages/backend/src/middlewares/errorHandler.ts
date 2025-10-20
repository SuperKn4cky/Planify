import { Request, Response } from "express";

export default class AppError extends Error {
    public statusCode: number;
    public details?: any;

    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

export function errorHandler(err: any, req: Request, res: Response) {
    const status = err.status || 500;
    const message = err.message || "An unexpected error occurred";
    res.status(status).json({
        error: {
            message,
            details: err.details || undefined,
        },
    });
}
