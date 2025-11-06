import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import AuthMiddleware from "../middlewares/authMiddleware.js";
import AuthService from "../services/authService.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../middlewares/errorHandler.js";
import { JWTPayload } from "jose";

const mockAuthService = {
    verifyToken: jest.fn<(token: string) => Promise<JWTPayload>>(),
    verifyRevocation: jest.fn<(payload: JWTPayload) => Promise<boolean>>(),
};

describe("AuthMiddleware", () => {
    let authMiddleware: AuthMiddleware;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    const testUserId = 123;
    const decodedPayload = { user_id: testUserId, iat: Date.now() / 1000 };

    beforeEach(() => {
        authMiddleware = new AuthMiddleware(
            mockAuthService as unknown as AuthService,
        );
        mockRequest = {
            cookies: {},
        };
        mockResponse = {
            status: jest.fn<(code: number) => Response>().mockReturnThis(),
            json: jest.fn<(body: any) => Response>().mockReturnThis(),
            clearCookie: jest
                .fn<(name: string, options?: any) => Response>()
                .mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe("isAuthenticated", () => {
        it("devrait appeler next() et définir req.user pour un jeton valide et non révoqué", async () => {
            const token = "valid_token_string";
            mockRequest.cookies = { auth: `Bearer ${token}` };
            mockAuthService.verifyToken.mockResolvedValue(decodedPayload);
            mockAuthService.verifyRevocation.mockResolvedValue(false);

            await authMiddleware.isAuthenticated(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
            expect(mockAuthService.verifyRevocation).toHaveBeenCalledWith(
                decodedPayload,
            );
            expect(mockRequest.user).toEqual({ id: testUserId });
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it("devrait retourner 401 si aucun cookie 'auth' n'est fourni", async () => {
            mockRequest.cookies = {};

            await authMiddleware.isAuthenticated(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Token is missing",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("devrait retourner 401 si le cookie 'auth' n'est pas au format 'Bearer <token>'", async () => {
            mockRequest.cookies = { auth: "invalid_token_format" };

            await authMiddleware.isAuthenticated(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Token is missing",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("devrait retourner 401 si AuthService.verifyToken lance une erreur", async () => {
            const token = "invalid_or_expired_token";
            mockRequest.cookies = { auth: `Bearer ${token}` };
            mockAuthService.verifyToken.mockRejectedValue(
                new AppError("Invalid or expired token", 401),
            );

            await authMiddleware.isAuthenticated(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid or expired token",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("devrait retourner 401 si le jeton est révoqué", async () => {
            const token = "revoked_token";
            mockRequest.cookies = { auth: `Bearer ${token}` };
            mockAuthService.verifyToken.mockResolvedValue(decodedPayload);
            mockAuthService.verifyRevocation.mockResolvedValue(true);

            await authMiddleware.isAuthenticated(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
            expect(mockAuthService.verifyRevocation).toHaveBeenCalledWith(
                decodedPayload,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Token has been revoked",
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
