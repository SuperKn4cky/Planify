import { SignJWT, jwtVerify, JWTPayload, errors } from "jose";
import UserService from "./userService.js";
import AppError from "../middlewares/errorHandler.js";

export default class AuthService {
    private secret: Uint8Array;
    private userService!: UserService;

    public constructor(secret: string) {
        this.secret = new TextEncoder().encode(secret);
    }
    public setUserService(userService: UserService): void {
        this.userService = userService;
    }

    public async generateToken(
        payload: Record<string, unknown>,
        expiresIn: string | number | Date,
        creationDate?: Date,
    ): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt(creationDate)
            .setExpirationTime(expiresIn)
            .sign(this.secret);
    }

    public async verifyToken(token: string): Promise<JWTPayload> {
        try {
            const { payload } = await jwtVerify(token, this.secret);
            return payload;
        } catch (error) {
            if (
                error instanceof errors.JWSSignatureVerificationFailed ||
                error instanceof errors.JWSInvalid ||
                error instanceof errors.JWTExpired ||
                error instanceof errors.JWTInvalid
            ) {
                throw new AppError("Invalid or expired token", 401);
            }
            throw new AppError("Token verification failed", 500);
        }
    }

    public async verifyRevocation(payload: JWTPayload): Promise<boolean> {
        if (
            !payload ||
            typeof payload.iat !== "number" ||
            typeof payload.user_id !== "number"
        ) {
            throw new AppError("Invalid payload", 400);
        }
        const revocationTimestamp =
            await this.userService.getRevocationTimestamp(payload.user_id);
        const tokenCreationTime = new Date(payload.iat * 1000);
        if (
            revocationTimestamp &&
            new Date(revocationTimestamp) > tokenCreationTime
        ) {
            return true;
        }

        return false;
    }
}
