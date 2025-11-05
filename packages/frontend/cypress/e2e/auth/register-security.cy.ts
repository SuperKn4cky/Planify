import { uniqueEmail, validPassword } from "../../support/e2e";

describe("Sécurité - Register", () => {
    it("bloque la soumission avec email invalide (aucune requête envoyée)", () => {
        cy.visit("/auth/register");
        cy.intercept("POST", "/api/auth/register").as("register");
        cy.fillRegisterForm({
            firstname: "John",
            lastname: "Doe",
            email: "not-an-email",
            password: validPassword,
        });
        cy.contains('button[type="submit"]', "Créer le compte").click();
        cy.get("@register.all").should("have.length", 0);
    });

    it("défend HttpOnly/SameSite sur le Set-Cookie et empêche l'accès via document.cookie", () => {
        cy.visit("/auth/register");
        const email = uniqueEmail("cookie");
        cy.intercept("POST", "/api/auth/register").as("register");
        cy.fillRegisterForm({
            firstname: "John",
            lastname: "Doe",
            email,
            password: validPassword,
        });
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
        const email = uniqueEmail("revoke");
        cy.intercept("POST", "/api/auth/register").as("register");
        cy.fillRegisterForm({
            firstname: "John",
            lastname: "Doe",
            email,
            password: validPassword,
        });
        cy.contains('button[type="submit"]', "Créer le compte").click();
        cy.wait("@register").its("response.statusCode").should("eq", 201);

        cy.request("GET", "/api/users/me").its("status").should("eq", 200);

        cy.intercept("POST", "/api/auth/logout-all").as("logoutAll");
        cy.window().then((win) =>
            win.fetch("/api/auth/logout-all", {
                method: "POST",
                credentials: "include",
            }),
        );
        cy.wait("@logoutAll").its("response.statusCode").should("eq", 200);

        cy.request({
            method: "GET",
            url: "/api/users/me",
            failOnStatusCode: false,
        })
            .its("status")
            .should("eq", 401);
    });
});
