import request from "supertest";
import { jest } from "@jest/globals";

const ALLOWED_ORIGIN = "http://localhost:3000";
const BLOCKED_ORIGIN = "http://evil.com";

describe("CORS - preflight OPTIONS", () => {
    test("préflight autorisé -> renvoie les en-têtes CORS attendus", async () => {
        const res = await request(global.app)
            .options("/auth/login")
            .set("Origin", ALLOWED_ORIGIN)
            .set("Access-Control-Request-Method", "POST")
            .send();

        expect([200, 204]).toContain(res.status);
        expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
        expect(res.headers["access-control-allow-credentials"]).toBe("true");

        const allowMethods = (res.headers["access-control-allow-methods"] ||
            "") as string;
        expect(allowMethods).toMatch(/GET/);
        expect(allowMethods).toMatch(/POST/);
        expect(allowMethods).toMatch(/PUT/);
        expect(allowMethods).toMatch(/DELETE/);
        expect(allowMethods).toMatch(/OPTIONS/);

        const allowHeaders = (res.headers["access-control-allow-headers"] ||
            "") as string;
        expect(allowHeaders.toLowerCase()).toMatch(/content-type/);
        expect(allowHeaders.toLowerCase()).toMatch(/authorization/);

        const maxAge = res.headers["access-control-max-age"];
        if (maxAge !== undefined) {
            expect(String(maxAge)).toMatch(/^\d+$/);
        }

        const vary = (res.headers["vary"] || "") as string;
        expect(vary.toLowerCase()).toContain("origin");
    });

    test('préflight refusé -> 500 "Internal Server Error" et pas de CORS headers', async () => {
        const warnSpy = jest
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        const errSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const res = await request(global.app)
            .options("/auth/login")
            .set("Origin", BLOCKED_ORIGIN)
            .set("Access-Control-Request-Method", "POST")
            .send();

        expect(res.status).toBe(500);
        const errMsg = res.body?.error?.message || res.text || "";
        expect(errMsg).toBe("Internal Server Error");
        expect(res.headers["access-control-allow-origin"]).toBeUndefined();

        warnSpy.mockRestore();
        errSpy.mockRestore();
    });
});

describe("CORS - requêtes réelles avec Origin autorisée", () => {
    test("GET protégé inclut les headers CORS (même si 401)", async () => {
        const res = await request(global.app)
            .get("/users/me")
            .set("Origin", ALLOWED_ORIGIN);
        expect(res.status).toBe(401);
        expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
        expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    test("POST public inclut les headers CORS (register)", async () => {
        const user = newUser();
        const res = await request(global.app)
            .post("/auth/register")
            .set("Origin", ALLOWED_ORIGIN)
            .send(user);

        expect([201, 422]).toContain(res.status);
        expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
        expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });
});
