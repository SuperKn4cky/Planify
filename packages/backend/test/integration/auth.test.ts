import request from "supertest";

function getSetCookieArray(headers: Record<string, unknown>): string[] {
    const h = headers["set-cookie"] as string[] | string | undefined;
    return Array.isArray(h) ? h : h ? [h] : [];
}

describe("POST /auth/register", () => {
    it(
        "devrait retourner 422 et les messages 'Password must be at least 12 characters long', " +
            "'Password must contain at least one uppercase letter', " +
            "'Password must contain at least one digit', " +
            " 'Password must contain at least one special character (@$!%*?&)'",
        async () => {
            const response = await request(global.app)
                .post("/auth/register")
                .send({
                    first_name: "Test",
                    last_name: "User",
                    email: "test@example.com",
                    password: "password",
                });

            expect(response.status).toBe(422);
            expect(response.body.error.messages).toContain(
                "Password must be at least 12 characters long",
            );
            expect(response.body.error.messages).toContain(
                "Password must contain at least one uppercase letter",
            );
            expect(response.body.error.messages).toContain(
                "Password must contain at least one digit",
            );
            expect(response.body.error.messages).toContain(
                "Password must contain at least one special character (@$!%*?&)",
            );
        },
    );

    it("devrait retourner 422 et le message 'Invalid email format'", async () => {
        const response = await request(global.app).post("/auth/register").send({
            first_name: "Test",
            last_name: "User",
            email: "invalid-email",
            password: "Password123!",
        });

        expect(response.status).toBe(422);
        expect(response.body.error.messages).toContain("Invalid email format");
    });

    it("devrait retourner 201, les détails de l'utilisateur pour un enregistrement réussi et un token", async () => {
        const userData = newUser();
        const response = await request(global.app)
            .post("/auth/register")
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.message).toEqual("User created successfully");
        expect(response.body.data.email).toEqual(userData.email);

        const cookies = getSetCookieArray(response.headers);
        expect(cookies.length).toBeGreaterThan(0);
        expect(cookies[0]).toMatch(
            /^auth=Bearer%20[^;]+; Max-Age=604800; Path=\/; Expires=[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT; HttpOnly; SameSite=Lax$/,
        );
    });
});

describe("POST /auth/login", () => {
    it("devrait retourner 400 si l'email est manquant", async () => {
        const response = await request(global.app)
            .post("/auth/login")
            .send({ password: "a_password" });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toEqual(
            "Email and password are required",
        );
    });

    it("devrait retourner 400 si le mot de passe est manquant", async () => {
        const response = await request(global.app)
            .post("/auth/login")
            .send({ email: "test@example.com" });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toEqual(
            "Email and password are required",
        );
    });

    it("devrait retourner 401 pour des identifiants invalides", async () => {
        const response = await request(global.app).post("/auth/login").send({
            email: "nonexistent@example.com",
            password: "wrongpassword",
        });

        expect(response.status).toBe(401);
        expect(response.body.error.message).toEqual(
            "Invalid email or password",
        );
    });

    it("devrait retourner 200 et un token pour une connexion réussie", async () => {
        const userData = newUser();
        await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);

        const response = await request(global.app)
            .post("/auth/login")
            .send({ email: userData.email, password: userData.password });

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual("Login successful");

        const cookies = getSetCookieArray(response.headers);
        expect(cookies.length).toBeGreaterThan(0);
        expect(cookies[0]).toMatch(
            /^auth=Bearer%20[^;]+; Max-Age=604800; Path=\/; Expires=[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT; HttpOnly; SameSite=Lax$/,
        );
    });

    it("POST /auth/login -> 400 si champs manquants", async () => {
        const res = await request(global.app).post("/auth/login").send({});
        expect(res.status).toBe(400);
        expect(res.body?.error?.message).toBe(
            "Email and password are required",
        );
    });

    it("POST /auth/login -> 401 si identifiants invalides", async () => {
        const res = await request(global.app)
            .post("/auth/login")
            .send({
                email: "not-registered@example.com",
                password: "WrongPassword!23456",
            });
        expect(res.status).toBe(401);
        expect(res.body?.error?.message).toBe("Invalid email or password");
    });

    it("POST /auth/login -> 200, Set-Cookie auth=Bearer..., HttpOnly, SameSite=Lax (exact)", async () => {
        const u = newUser({ email_prefix: "login-ok" });
        await request(global.app).post("/auth/register").send(u).expect(201);

        const res = await request(global.app)
            .post("/auth/login")
            .send({ email: u.email, password: u.password });
        expect(res.status).toBe(200);

        const cookies = getSetCookieArray(res.headers);
        expect(cookies.length).toBeGreaterThan(0);
        expect(cookies[0]).toMatch(
            /^auth=Bearer%20[^;]+; Max-Age=604800; Path=\/; Expires=[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT; HttpOnly; SameSite=Lax$/,
        );
    });
});

describe("POST /auth/logout & /auth/logout-all", () => {
    it("POST /auth/logout -> 200 et clearCookie du cookie auth (exact)", async () => {
        const u = newUser({ email_prefix: "logout" });
        const reg = await request(global.app)
            .post("/auth/register")
            .send(u)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app)
            .post("/auth/logout")
            .set("Cookie", cookie)
            .expect(200);
        const cookies = getSetCookieArray(res.headers);
        expect(cookies.length).toBeGreaterThan(0);
        expect(cookies[0]).toBe(
            "auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        );
    });

    it("devrait retourner 401 si l'utilisateur n'est pas authentifié", async () => {
        const response = await request(global.app)
            .post("/auth/logout-all")
            .send();

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual("Token is missing");
    });

    it("devrait retourner 200 pour une déconnexion réussie", async () => {
        const userData = newUser();
        const registerResponse = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);

        const cookie = registerResponse.headers["set-cookie"];

        const response = await request(global.app)
            .post("/auth/logout-all")
            .set("Cookie", cookie)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual(
            "All tokens revoked successfully",
        );
    });

    it("devrait retourner 401 et le message 'Token has been revoked' pour un token révoqué", async () => {
        const userData = newUser();
        const registerResponse = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);

        const cookie = registerResponse.headers["set-cookie"];

        await request(global.app)
            .post("/auth/logout-all")
            .set("Cookie", cookie)
            .send()
            .expect(200);

        const response = await request(global.app)
            .post("/auth/logout-all")
            .set("Cookie", cookie)
            .send();

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual("Token has been revoked");
    });

    it("POST /auth/logout-all -> 401 si non authentifié (middleware)", async () => {
        const res = await request(global.app).post("/auth/logout-all");
        expect(res.status).toBe(401);
        expect(res.body?.error).toBe("Token is missing");
    });

    it("POST /auth/logout-all -> 200 puis le token précédent est révoqué (401 Token has been revoked)", async () => {
        const u = newUser({ email_prefix: "logout-all" });
        const reg = await request(global.app)
            .post("/auth/register")
            .send(u)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        await request(global.app)
            .post("/auth/logout-all")
            .set("Cookie", cookie)
            .expect(200);

        const me = await request(global.app)
            .get("/users/me")
            .set("Cookie", cookie);
        expect(me.status).toBe(401);
        expect(me.body?.error).toBe("Token has been revoked");
    });
});
