import { uniqueEmail, validPassword } from "../../support/e2e";

describe("Sécurité - Login", () => {
    const ui = {
        email: "#email",
        password: "#password",
        loginBtn: "Connexion",
        formError: "#form-error",
    };

    beforeEach(() => {
        cy.clearCookies();
    });

    it("renvoie 401 générique pour identifiants invalides", () => {
        cy.visit("/auth/login");
        cy.fillLoginForm({
            email: "nonexistent@example.com",
            password: "WrongPass!123",
        });
        cy.intercept("POST", "/api/auth/login").as("login");
        cy.contains('button[type="submit"]', ui.loginBtn).click();
        cy.wait("@login").its("response.statusCode").should("eq", 401);
        cy.get(ui.formError)
            .should("be.visible")
            .and("contain", "Email ou mot de passe incorrect.");
    });

    it("login pose un cookie HttpOnly + SameSite=Strict et l'entête Set-Cookie est correct", () => {
        const email = uniqueEmail("login-cookie");
        cy.visit("/auth/register");
        cy.fillRegisterForm({
            firstname: "Cookie",
            lastname: "Check",
            email,
            password: validPassword,
        });
        cy.intercept("POST", "/api/auth/register").as("register");
        cy.contains('button[type="submit"]', "Créer le compte").click();
        cy.wait("@register").its("response.statusCode").should("eq", 201);

        cy.logout();

        cy.visit("/auth/login");
        cy.fillLoginForm({ email, password: validPassword });
        cy.intercept("POST", "/api/auth/login").as("login");
        cy.contains('button[type="submit"]', ui.loginBtn).click();
        cy.wait("@login").then(({ response }) => {
            expect(response?.statusCode).to.eq(200);
            const setCookie = String(response?.headers?.["set-cookie"] ?? "");
            expect(setCookie).to.include("HttpOnly");
            expect(setCookie).to.include("SameSite=Strict");
        });
    });
});
