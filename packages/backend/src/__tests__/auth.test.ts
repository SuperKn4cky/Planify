import request from "supertest";
import { users } from "../db/schema.js";

describe("POST /auth/register", () => {
    beforeEach(async () => {
        await global.db.delete(users);
    });

    it("devrait retourner 422 et les messages 'Password must be at least 12 characters long', \
            'Password must contain at least one uppercase letter', \
            'Password must contain at least one digit', \
            'Password must contain at least one special character (@$!%*?&)'", async () => {
        const response = await request(global.app).post("/auth/register").send({
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
    });

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
        const userData = {
            first_name: "Test",
            last_name: "User",
            email: "test@example.com",
            password: "Password123!",
        };
        const response = await request(global.app)
            .post("/auth/register")
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.message).toEqual("User created successfully");
        expect(response.body.data.email).toEqual(userData.email);
        const cookieHeader = response.headers["set-cookie"];
        expect(cookieHeader[0]).toMatch(/^auth=Bearer%20/);
    });
});

describe("POST /auth/login", () => {
    beforeEach(async () => {
        await global.db.delete(users);
    });

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
        const userData = {
            first_name: "Test",
            last_name: "User",
            email: "test@example.com",
            password: "Password123!",
        };
        await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);

        const response = await request(global.app)
            .post("/auth/login")
            .send({ email: userData.email, password: userData.password });

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual("Login successful");
        const cookieHeader = response.headers["set-cookie"];
        expect(cookieHeader[0]).toMatch(/^auth=Bearer%20/);
    });
});

describe("POST /auth/logout", () => {
    beforeEach(async () => {
        await global.db.delete(users);
    });

    it("devrait retourner 401 si l'utilisateur n'est pas authentifié", async () => {
        const response = await request(global.app).post("/auth/logout").send();

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual("Token is missing");
    });

    it("devrait retourner 200 pour une déconnexion réussie", async () => {
        const userData = {
            first_name: "Test",
            last_name: "User",
            email: "test@example.com",
            password: "Password123!",
        };
        const registerResponse = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);

        const cookie = registerResponse.headers["set-cookie"];

        const response = await request(global.app)
            .post("/auth/logout")
            .set("Cookie", cookie)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual("Logout successful");
    });

    it("devrait retourner 401 et le message 'Token has been revoked' pour un token révoqué", async () => {
        const userData = {
            first_name: "Test",
            last_name: "User",
            email: "test@example.com",
            password: "Password123!",
        };
        const registerResponse = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);

        const cookie = registerResponse.headers["set-cookie"];

        await request(global.app)
            .post("/auth/logout")
            .set("Cookie", cookie)
            .send()
            .expect(200);

        const response = await request(global.app)
            .post("/auth/logout")
            .set("Cookie", cookie)
            .send();

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual("Token has been revoked");
    });
});
