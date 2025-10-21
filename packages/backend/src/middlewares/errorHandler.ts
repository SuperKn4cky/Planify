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

export function errorHandler(error: any, req: Request, res: Response) {
    const status = error.status || 500;
    const message = error.message || "An unexpected error occurred";
    res.status(status).json({
        error: {
            message,
            details: error.details || undefined,
        },
    });
}
