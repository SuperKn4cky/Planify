import { Request, Response, NextFunction } from "express";
import { SignJWT, jwtVerify } from "jose";

export class AuthMiddleware {
    private secret: Uint8Array;

    constructor(secret: string) {
        this.secret = new TextEncoder().encode(secret);
    }

    public generateToken(user_id: number, expiresIn: string | number): Promise<string> {
        return new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime(expiresIn)
            .sign(this.secret);
    }

    public isAuthenticated(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        
        const token = authHeader.split(" ")[1];

        jwtVerify(token, this.secret)
            .then(() => next())
            .catch(() => res.status(401).json({ error: "Invalid token" }));
    }

}
