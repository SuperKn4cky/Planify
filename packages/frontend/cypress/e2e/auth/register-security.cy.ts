import { uniqueEmail, validPassword } from "../../support/e2e";

describe("Sécurité - Register", () => {
    const BACKEND = "http://localhost:4000";

    it("refuse un email invalide côté serveur (422) sans passer par l'UI", () => {
        cy.request({
            method: "POST",
            url: `${BACKEND}/auth/register`,
            failOnStatusCode: false,
            body: {
                firstname: "Test",
                lastname: "User",
                email: "invalid-email",
                password: validPassword,
            },
            headers: { "Content-Type": "application/json" },
        }).then((res) => {
            expect(res.status).to.eq(422);
            expect(
                (res.body?.error?.messages ?? []).some((m: string) =>
                    m.includes("Invalid email format"),
                ),
            ).to.eq(true);
        });
    });

    it("défend HttpOnly/SameSite sur le Set-Cookie et empêche l'accès via document.cookie", () => {
        cy.visit("/auth/register");

        cy.fillRegisterForm({
            firstname: "Alice",
            lastname: "Martin",
            email: uniqueEmail("cookie"),
            password: validPassword,
        });

        cy.intercept("POST", "/api/auth/register").as("register");
        cy.contains('button[type="submit"]', "Créer le compte").click();

        cy.wait("@register").then(({ response }) => {
            expect(response?.statusCode).to.eq(201);
            const setCookie = String(response?.headers?.["set-cookie"] ?? "");
            expect(setCookie).to.include("HttpOnly");
            expect(setCookie).to.include("SameSite=Lax");
        });

        cy.document().then((doc) => {
            expect(doc.cookie).to.not.include("auth=");
        });
    });

    it("révoque les sessions (logout-all) et interdit ensuite /api/users/me", () => {
        cy.visit("/auth/register");

        cy.fillRegisterForm({
            firstname: "Bob",
            lastname: "Durand",
            email: uniqueEmail("revoke"),
            password: validPassword,
        });

        cy.contains('button[type="submit"]', "Créer le compte").click();

        cy.request("GET", "/api/users/me").its("status").should("eq", 200);

        cy.request("POST", "/api/auth/logout-all")
            .its("status")
            .should("eq", 200);

        cy.request({
            method: "GET",
            url: "/api/users/me",
            failOnStatusCode: false,
        })
            .its("status")
            .should("eq", 401);
    });

    it("bloque CORS pour une origine non autorisée (pas d'ACAO)", () => {
        cy.request({
            method: "OPTIONS",
            url: `${BACKEND}/auth/register`,
            failOnStatusCode: false,
            headers: {
                Origin: "http://evil.local",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        }).then((res) => {
            expect(res.headers["access-control-allow-origin"]).to.be.undefined;
        });
    });
});
