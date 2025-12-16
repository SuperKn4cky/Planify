import request from "supertest";

describe("Profil - /users/me", () => {
    it("GET /users/me -> 401 si non authentifié", async () => {
        const res = await request(global.app).get("/users/me");
        expect(res.status).toBe(401);
        expect(res.body?.error).toBe("Token is missing");
    });

    it("GET /users/me -> 200 et renvoie les données publiques", async () => {
        const u = newUser({ email_prefix: "getme" });
        const reg = await request(global.app)
            .post("/auth/register")
            .send(u)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app)
            .get("/users/me")
            .set("Cookie", cookie)
            .expect(200);
        expect(res.body).toMatchObject({
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
        });
    });

    it("PUT /users/me -> 401 si non authentifié", async () => {
        const res = await request(global.app)
            .put("/users/me")
            .send({ first_name: "John" });
        expect(res.status).toBe(401);
        expect(res.body?.error).toBe("Token is missing");
    });

    it("PUT /users/me -> 422 validation Zod (email invalide)", async () => {
        const u = newUser({ email_prefix: "upd-422" });
        const reg = await request(global.app)
            .post("/auth/register")
            .send(u)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app)
            .put("/users/me")
            .set("Cookie", cookie)
            .send({ email: "invalid" })
            .expect(422);

        expect(res.body?.error?.message).toBe("Validation failed");
        expect(res.body?.error?.messages).toEqual(
            expect.arrayContaining(["Invalid email format"]),
        );
    });

    it("PUT /users/me -> 400 si email déjà utilisé", async () => {
        const a = newUser({ email_prefix: "dup-a" });
        const b = newUser({ email_prefix: "dup-b" });
        const regA = await request(global.app)
            .post("/auth/register")
            .send(a)
            .expect(201);
        await request(global.app).post("/auth/register").send(b).expect(201);
        const cookieA = regA.headers["set-cookie"];

        const res = await request(global.app)
            .put("/users/me")
            .set("Cookie", cookieA)
            .send({ email: b.email });

        expect(res.status).toBe(400);
        expect(res.body?.error?.message).toBe("This email is already in use.");
    });

    it("PUT /users/me -> 204 succès, puis GET reflète la mise à jour", async () => {
        const u = newUser({ email_prefix: "upd-204" });
        const reg = await request(global.app)
            .post("/auth/register")
            .send(u)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const updated = {
            first_name: "Johnny",
            last_name: "Doerz",
            email: uniqueEmail("upd-204-new"),
        };

        await request(global.app)
            .put("/users/me")
            .set("Cookie", cookie)
            .send(updated)
            .expect(204);

        const me = await request(global.app)
            .get("/users/me")
            .set("Cookie", cookie)
            .expect(200);
        expect(me.body).toMatchObject({
            first_name: updated.first_name,
            last_name: updated.last_name,
            email: updated.email,
        });
    });

    it("DELETE /users/me -> 401 si non authentifié", async () => {
        const res = await request(global.app).delete("/users/me");
        expect(res.status).toBe(401);
        expect(res.body?.error).toBe("Token is missing");
    });

    it("DELETE /users/me -> 200, clearCookie, et l’ancien cookie échoue ensuite (401)", async () => {
        const u = newUser({ email_prefix: "delme" });
        const reg = await request(global.app)
            .post("/auth/register")
            .send(u)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const del = await request(global.app)
            .delete("/users/me")
            .set("Cookie", cookie)
            .expect(200);
        const raw = del.headers["set-cookie"];
        const setCookie = Array.isArray(raw) ? raw : raw ? [raw] : [];
        expect(setCookie.join(";")).toContain("auth=");
        expect(setCookie.join(";")).toContain("Path=/");

        const me = await request(global.app)
            .get("/users/me")
            .set("Cookie", cookie);
        expect(me.status).toBe(401);
        expect(me.body?.error).toBe("User not found");
    });
});
