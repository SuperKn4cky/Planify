import {
    jest,
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from "@jest/globals";
import AuthService from "../../src/services/authService.js";
import UserService from "../../src/services/userService.js";
import AppError from "../../src/middlewares/errorHandler.js";
import * as jose from "jose";

const mockUserService = {
    getRevocationTimestamp: jest.fn<(user_id: number) => Promise<Date>>(),
};

describe("AuthService", () => {
    let authService: AuthService;
    const jwtSecret = "super_secret_for_auth_service_tests_1234567890";
    const testUserId = 123;
    let secretKey: Uint8Array;

    beforeEach(() => {
        authService = new AuthService(jwtSecret);
        authService.setUserService(mockUserService as unknown as UserService);
        secretKey = new TextEncoder().encode(jwtSecret);
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("generateToken", () => {
        it("devrait générer un jeton JWT valide avec le bon payload", async () => {
            const token = await authService.generateToken(
                { user_id: testUserId },
                "1h",
            );
            expect(token).toBeDefined();

            const { payload } = await jose.jwtVerify(token, secretKey);
            expect(payload.user_id).toBe(testUserId);
            expect(payload.exp).toBeDefined();
            expect(payload.iat).toBeDefined();
        });

        it("devrait utiliser la date d'émission fournie", async () => {
            const issueDate = new Date("2023-01-01T00:00:00.000Z");
            jest.setSystemTime(issueDate);

            const token = await authService.generateToken(
                { user_id: testUserId },
                "1h",
                issueDate,
            );

            const { payload } = await jose.jwtVerify(token, secretKey);
            expect(payload.iat).toBe(Math.floor(issueDate.getTime() / 1000));
        });
    });

    describe("verifyToken", () => {
        it("devrait vérifier un jeton valide et retourner son payload", async () => {
            const token = await new jose.SignJWT({ user_id: testUserId })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("1h")
                .sign(secretKey);

            const payload = await authService.verifyToken(token);
            expect(payload).toBeDefined();
            expect(payload.user_id).toBe(testUserId);
        });

        it("devrait lancer une AppError pour une signature de jeton invalide", async () => {
            const wrongSecretKey = new TextEncoder().encode("wrong_secret");
            const invalidToken = await new jose.SignJWT({ user_id: testUserId })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("1h")
                .sign(wrongSecretKey);

            await expect(authService.verifyToken(invalidToken)).rejects.toThrow(
                AppError,
            );
            await expect(authService.verifyToken(invalidToken)).rejects.toThrow(
                "Invalid or expired token",
            );
        });

        it("devrait lancer une AppError pour un jeton malformé", async () => {
            const malformedToken = "header.payload.signature";
            await expect(
                authService.verifyToken(malformedToken),
            ).rejects.toThrow(AppError);
            await expect(
                authService.verifyToken(malformedToken),
            ).rejects.toThrow("Invalid or expired token");
        });

        it("devrait lancer une AppError pour un jeton expiré", async () => {
            const expiredToken = await new jose.SignJWT({ user_id: testUserId })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("0s")
                .sign(secretKey);

            jest.advanceTimersByTime(500);

            await expect(authService.verifyToken(expiredToken)).rejects.toThrow(
                AppError,
            );
            await expect(authService.verifyToken(expiredToken)).rejects.toThrow(
                "Invalid or expired token",
            );
        });
    });

    describe("verifyRevocation", () => {
        it("devrait retourner false si le timestamp de révocation est antérieur à l'émission du jeton", async () => {
            const tokenIssueTime = new Date("2023-10-27T10:00:00Z");
            const revocationTime = new Date("2023-10-27T09:00:00Z");
            const payload = {
                user_id: testUserId,
                iat: Math.floor(tokenIssueTime.getTime() / 1000),
            };

            mockUserService.getRevocationTimestamp.mockResolvedValue(
                revocationTime,
            );

            const isRevoked = await authService.verifyRevocation(payload);
            expect(isRevoked).toBe(false);
            expect(mockUserService.getRevocationTimestamp).toHaveBeenCalledWith(
                testUserId,
            );
        });

        it("devrait retourner true si le timestamp de révocation est postérieur à l'émission du jeton", async () => {
            const tokenIssueTime = new Date("2023-10-27T10:00:00Z");
            const revocationTime = new Date("2023-10-27T11:00:00Z");
            const payload = {
                user_id: testUserId,
                iat: Math.floor(tokenIssueTime.getTime() / 1000),
            };

            mockUserService.getRevocationTimestamp.mockResolvedValue(
                revocationTime,
            );

            const isRevoked = await authService.verifyRevocation(payload);
            expect(isRevoked).toBe(true);
        });

        it("devrait lancer une AppError si le payload ne contient pas user_id ou iat", async () => {
            await expect(
                authService.verifyRevocation({ user_id: testUserId }),
            ).rejects.toThrow(AppError);
            await expect(
                authService.verifyRevocation({ iat: 12345 }),
            ).rejects.toThrow(AppError);
        });
    });
});
