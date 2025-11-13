import {
    jest,
    describe,
    it,
    expect,
    beforeEach,
    beforeAll,
} from "@jest/globals";
import UserService from "../../src/services/userService.js";
import AuthService from "../../src/services/authService.js";
import { DrizzleQueryError } from "drizzle-orm";
import argon2 from "argon2";
import { afterEach } from "@jest/globals";

jest.mock("../../src/services/authService.js");

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

const MockedAuthService = jest.mocked(AuthService);

type Row = any;
type PromiseRows = Promise<Row[]>;

// Fabrique de chaines drizzle pour .select(...).from(...).where(...).limit(1)
function makeSelectChain(returnRows: Row[] | (() => Row[] | PromiseRows)) {
    const limit = jest.fn(() =>
        typeof returnRows === "function"
            ? (returnRows as any)()
            : Promise.resolve(returnRows),
    );
    const where = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ where }));
    const select = jest.fn(() => ({ from }));
    return { select, from, where, limit };
}

// Fabrique pour insert(...).values(...).returning()
function makeInsertChain(returnRows: Row[] | (() => PromiseRows) | Error) {
    const returning = jest.fn(() => {
        if (returnRows instanceof Error) return Promise.reject(returnRows);
        if (typeof returnRows === "function") return (returnRows as any)();
        return Promise.resolve(returnRows);
    });
    const values = jest.fn(() => ({ returning }));
    const insert = jest.fn(() => ({ values }));
    return { insert, values, returning };
}

// Fabrique pour update(...).set(...).where(...).returning()
function makeUpdateChain(returnRowsOrVoid: Row[] | Error | "void" = "void") {
    const returning = jest.fn(() => {
        if (returnRowsOrVoid instanceof Error)
            return Promise.reject(returnRowsOrVoid);
        if (returnRowsOrVoid === "void") return Promise.resolve([]);
        return Promise.resolve(returnRowsOrVoid);
    });
    const where = jest.fn(() => ({ returning }));
    const set = jest.fn(() => ({ where }));
    const update = jest.fn(() => ({ set }));
    return { update, set, where, returning };
}

// Fabrique pour delete(...).where(...).returning()
function makeDeleteChain(returnRowsOrErr: Row[] | Error) {
    const returning = jest.fn(() => {
        if (returnRowsOrErr instanceof Error)
            return Promise.reject(returnRowsOrErr);
        return Promise.resolve(returnRowsOrErr);
    });
    const where = jest.fn(() => ({ returning }));
    const del = jest.fn(() => ({ where }));
    return { delete: del, where, returning };
}

describe("UserService", () => {
    let userService: UserService;
    let mockDb: any;
    let mockAuthService: jest.Mocked<AuthService>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthService = new MockedAuthService(
            "secret",
        ) as jest.Mocked<AuthService>;
        mockAuthService.generateToken = jest.fn();
    });

    describe("createUser", () => {
        it("retourne l'utilisateur public + token en cas de succès", async () => {
            jest.useFakeTimers();
            const now = new Date("2025-01-01T00:00:00.000Z");
            jest.setSystemTime(now);

            mockAuthService.generateToken.mockResolvedValue("tok123");

            const row = {
                id: 1,
                email: "john@doe.tld",
                first_name: "John",
                last_name: "Doe",
                revocation_timestamp: new Date(),
            };
            const { insert } = makeInsertChain([row]);

            mockDb = { insert };
            userService = new UserService(mockDb as any);
            userService.setAuthService(mockAuthService);

            const res = await userService.createUser({
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
                password: "PlainPassword!23456",
            } as any);

            expect(mockAuthService.generateToken).toHaveBeenCalledWith(
                { user_id: 1 },
                "7d",
                expect.any(Date),
            );
            expect(res.token).toBe("tok123");
            expect(res.toPublic()).toEqual({
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
            });
        });

        it("remonte 400 'This email is already in use.' si contrainte unique (code 23505)", async () => {
            const dupErr: any = new Error("duplicate key");
            dupErr.cause = { code: "23505" };
            Object.setPrototypeOf(dupErr, (DrizzleQueryError as any).prototype);

            const { insert } = makeInsertChain(dupErr);

            mockDb = { insert };
            userService = new UserService(mockDb as any);
            userService.setAuthService(mockAuthService);

            await expect(
                userService.createUser({
                    email: "a@a.tld",
                    first_name: "John",
                    last_name: "Doe",
                    password: "PasswordVeryStrong!234",
                } as any),
            ).rejects.toMatchObject({
                message: "This email is already in use.",
                status: 400,
            });
        });

        it("remonte 500 'User creation failed' sur erreur générique", async () => {
            const { insert } = makeInsertChain(new Error("db down"));

            mockDb = { insert };
            userService = new UserService(mockDb as any);
            userService.setAuthService(mockAuthService);

            await expect(
                userService.createUser({
                    email: "b@b.tld",
                    first_name: "John",
                    last_name: "Doe",
                    password: "PasswordVeryStrong!234",
                } as any),
            ).rejects.toMatchObject({
                message: "User creation failed",
                status: 500,
            });
        });
    });

    describe("loginUser", () => {
        let userWithRealHash: any;
        const plainPassword = "Password123!";

        beforeAll(async () => {
            const hash = await argon2.hash(plainPassword);
            userWithRealHash = {
                id: 10,
                email: "johndoe@example.com",
                password: hash,
                first_name: "John",
                last_name: "Doe",
                revocation_timestamp: new Date(),
            };
        });

        it("401 si aucun utilisateur trouvé", async () => {
            const { select } = makeSelectChain([]);

            mockDb = { select };
            userService = new UserService(mockDb as any);
            userService.setAuthService(mockAuthService);

            await expect(
                userService.loginUser("x@y.z", "pwd"),
            ).rejects.toMatchObject({
                message: "Invalid email or password",
                status: 401,
            });
        });

        it("401 si mot de passe invalide (argon2.verify false)", async () => {
            const { select } = makeSelectChain([userWithRealHash]);
            mockDb = { select };
            userService = new UserService(mockDb as any);
            userService.setAuthService(mockAuthService);

            await expect(
                userService.loginUser(userWithRealHash.email, "wrong_password"),
            ).rejects.toMatchObject({
                message: "Invalid email or password",
                status: 401,
            });
        });

        it("retourne le token en cas de succès", async () => {
            const { select } = makeSelectChain([userWithRealHash]);
            mockAuthService.generateToken.mockResolvedValue("tok_login");

            mockDb = { select };
            userService = new UserService(mockDb as any);
            userService.setAuthService(mockAuthService);

            const tok = await userService.loginUser(
                userWithRealHash.email,
                plainPassword,
            );
            expect(mockAuthService.generateToken).toHaveBeenCalledWith(
                { user_id: userWithRealHash.id },
                "7d",
            );
            expect(tok).toBe("tok_login");
        });

        it("500 'Login failed' sur erreur générique", async () => {
            const select = jest.fn(() => {
                throw new Error("select failed");
            });

            mockDb = { select };
            userService = new UserService(mockDb as any);
            userService.setAuthService(mockAuthService);

            await expect(
                userService.loginUser("a@a", "x"),
            ).rejects.toMatchObject({
                message: "Login failed",
                status: 500,
            });
        });
    });

    describe("revokeTokens", () => {
        it("résout sans erreur en cas de succès", async () => {
            const { update } = makeUpdateChain("void");
            mockDb = { update };
            userService = new UserService(mockDb as any);
            await expect(userService.revokeTokens(1)).resolves.toBeUndefined();
        });

        it("500 'Failed to revoke tokens' si update échoue", async () => {
            const update = jest.fn(() => {
                throw new Error("update failed");
            });
            mockDb = { update };
            userService = new UserService(mockDb as any);
            await expect(userService.revokeTokens(1)).rejects.toMatchObject({
                message: "Failed to revoke tokens",
                status: 500,
            });
        });
    });

    describe("getRevocationTimestamp", () => {
        it("retourne la date si trouvée", async () => {
            const ts = new Date("2023-01-01T00:00:00.000Z");
            const { select } = makeSelectChain([{ revocation_timestamp: ts }]);
            mockDb = { select };
            userService = new UserService(mockDb as any);
            const res = await userService.getRevocationTimestamp(5);
            expect(res.toISOString()).toBe(ts.toISOString());
        });

        it("401 'User not found' si aucun enregistrement", async () => {
            const { select } = makeSelectChain([]);
            mockDb = { select };
            userService = new UserService(mockDb as any);
            await expect(
                userService.getRevocationTimestamp(5),
            ).rejects.toMatchObject({
                message: "User not found",
                status: 401,
            });
        });

        it("500 'Failed to retrieve revocation timestamp' si erreur générique", async () => {
            const select = jest.fn(() => {
                throw new Error("select failed");
            });
            mockDb = { select };
            userService = new UserService(mockDb as any);
            await expect(
                userService.getRevocationTimestamp(5),
            ).rejects.toMatchObject({
                message: "Failed to retrieve revocation timestamp",
                status: 500,
            });
        });
    });

    describe("getUserByID", () => {
        it("retourne User si trouvé", async () => {
            const row = {
                id: 2,
                email: "jane@doe.tld",
                first_name: "Jane",
                last_name: "Doe",
            };
            const { select } = makeSelectChain([row]);
            mockDb = { select };
            userService = new UserService(mockDb as any);
            const user = await userService.getUserByID(2);
            expect(user.toPublic()).toEqual({
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
            });
        });

        it("404 'User not found' si vide", async () => {
            const { select } = makeSelectChain([]);
            mockDb = { select };
            userService = new UserService(mockDb as any);
            await expect(userService.getUserByID(99)).rejects.toMatchObject({
                message: "User not found",
                status: 404,
            });
        });

        it("500 'Failed to retrieve user' si erreur générique", async () => {
            const select = jest.fn(() => {
                throw new Error("select failed");
            });
            mockDb = { select };
            userService = new UserService(mockDb as any);
            await expect(userService.getUserByID(1)).rejects.toMatchObject({
                message: "Failed to retrieve user",
                status: 500,
            });
        });
    });

    describe("updateUserByID", () => {
        it("retourne User si update + returning renvoie une ligne", async () => {
            const row = {
                id: 3,
                email: "johndoe@example.com",
                first_name: "John",
                last_name: "Doe",
            };
            const { update } = makeUpdateChain([row]);
            mockDb = { update };
            userService = new UserService(mockDb as any);
            const user = await userService.updateUserByID(3, {
                first_name: "John",
            } as any);
            expect(user.toPublic()).toEqual({
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
            });
        });

        it("404 'User not found' si returning renvoie []", async () => {
            const { update } = makeUpdateChain([]);
            mockDb = { update };
            userService = new UserService(mockDb as any);
            await expect(
                userService.updateUserByID(3, { email: "a@a.tld" } as any),
            ).rejects.toMatchObject({ message: "User not found", status: 404 });
        });

        it("400 'This email is already in use.' si contrainte unique (23505)", async () => {
            const dupErr: any = new Error("duplicate");
            dupErr.cause = { code: "23505" };
            Object.setPrototypeOf(dupErr, (DrizzleQueryError as any).prototype);
            const { update } = makeUpdateChain(dupErr);
            mockDb = { update };
            userService = new UserService(mockDb as any);

            await expect(
                userService.updateUserByID(3, { email: "dup@dup.tld" } as any),
            ).rejects.toMatchObject({
                message: "This email is already in use.",
                status: 400,
            });
        });

        it("500 'Failed to update user' si erreur générique", async () => {
            const { update } = makeUpdateChain(new Error("update failed"));
            mockDb = { update };
            userService = new UserService(mockDb as any);
            await expect(
                userService.updateUserByID(3, { first_name: "X" } as any),
            ).rejects.toMatchObject({
                message: "Failed to update user",
                status: 500,
            });
        });
    });

    describe("deleteUserByID", () => {
        it("résout si une ligne supprimée", async () => {
            const { delete: del } = makeDeleteChain([{ id: 7 }]);
            mockDb = { delete: del };
            userService = new UserService(mockDb as any);
            await expect(
                userService.deleteUserByID(7),
            ).resolves.toBeUndefined();
        });

        it("404 'User not found' si []", async () => {
            const { delete: del } = makeDeleteChain([]);
            mockDb = { delete: del };
            userService = new UserService(mockDb as any);
            await expect(userService.deleteUserByID(7)).rejects.toMatchObject({
                message: "User not found",
                status: 404,
            });
        });

        it("500 'Failed to delete user' si erreur générique", async () => {
            const { delete: del } = makeDeleteChain(new Error("delete failed"));
            mockDb = { delete: del };
            userService = new UserService(mockDb as any);
            await expect(userService.deleteUserByID(7)).rejects.toMatchObject({
                message: "Failed to delete user",
                status: 500,
            });
        });
    });
});
