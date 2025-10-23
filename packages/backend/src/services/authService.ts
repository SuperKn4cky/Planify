import { SignJWT, jwtVerify, JWTPayload } from "jose";

export default class AuthService {
    private secret: Uint8Array;

    public constructor(secret: string) {
        this.secret = new TextEncoder().encode(secret);
    }

    public async generateToken(
        user_id: number,
        expiresIn: string | number,
    ): Promise<string> {
        return new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime(expiresIn)
            .sign(this.secret);
    }

    public async verifyToken(token: string): Promise<JWTPayload> {
        const { payload } = await jwtVerify(token, this.secret);
        return payload;
    }
}
