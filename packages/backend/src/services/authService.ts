import { SignJWT, jwtVerify, JWTPayload } from "jose";
import UserService from "./userService.js";

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
    ): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime(expiresIn)
            .sign(this.secret);
    }

    public async verifyToken(token: string): Promise<JWTPayload> {
        const { payload } = await jwtVerify(token, this.secret);
        return payload;
    }

    public async verifyRevocation(payload: JWTPayload): Promise<boolean> {
        if (
            !payload ||
            typeof payload.iat !== "number" ||
            typeof payload.user_id !== "number"
        ) {
            throw new Error("Invalid payload.");
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
