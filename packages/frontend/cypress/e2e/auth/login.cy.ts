import { uniqueEmail, validPassword } from "../../support/e2e";

describe("Parcours Connexion (Login)", () => {
    const ui = {
        email: "#email",
        password: "#password",
        submitLabel: "Connexion",
        formError: "#form-error",
    };

    beforeEach(() => {
        cy.clearCookies();
    });

    it('affiche "Email invalide" (Zod) et n\'envoie pas de requête', () => {
        cy.visit("/auth/login");

        cy.get(ui.email).type("not-an-email");
        cy.get(ui.password).type(validPassword);

        cy.intercept("POST", "/api/auth/login").as("login");
        cy.contains('button[type="submit"]', ui.submitLabel).click();

        cy.get(ui.formError)
            .should("be.visible")
            .and("contain", "Email invalide");
        cy.get("@login.all").should("have.length", 0);
    });

    it('affiche "Mot de passe requis" et n\'envoie pas de requête', () => {
        cy.visit("/auth/login");

        cy.get(ui.email).type("john.doe@example.com");
        // mot de passe vide

        cy.intercept("POST", "/api/auth/login").as("login");
        cy.contains('button[type="submit"]', ui.submitLabel).click();

        cy.get(ui.formError)
            .should("be.visible")
            .and("contain", "Mot de passe requis");
        cy.get("@login.all").should("have.length", 0);
    });

    it('refuse des identifiants invalides (401) et affiche "Email ou mot de passe incorrect."', () => {
        cy.visit("/auth/login");

        cy.fillLoginForm({
            email: "unknown@example.com",
            password: "WrongPass!123",
        });

        cy.intercept("POST", "/api/auth/login").as("login");
        cy.contains('button[type="submit"]', ui.submitLabel).click();

        cy.wait("@login").its("response.statusCode").should("eq", 401);
        cy.get(ui.formError)
            .should("be.visible")
            .and("contain", "Email ou mot de passe incorrect.");
    });

    it("connexion réussie: cookie HttpOnly posé, /api/users/me → 200, redirection dashboard", () => {
        const email = uniqueEmail("login-ok");

        cy.visit("/auth/register");
        cy.fillRegisterForm({ firstname: "John", lastname: "Doe", email });
        cy.get("#password").type(validPassword);
        cy.get("#confirm").type(validPassword);
        cy.intercept("POST", "/api/auth/register").as("register");
        cy.contains('button[type="submit"]', "Créer le compte").click();
        cy.wait("@register").its("response.statusCode").should("eq", 201);

        cy.logout();

        cy.visit("/auth/login");
        cy.fillLoginForm({ email, password: validPassword });
        cy.intercept("POST", "/api/auth/login").as("login");
        cy.contains('button[type="submit"]', ui.submitLabel).click();

        cy.wait("@login").then(({ response }) => {
            expect(response?.statusCode).to.eq(200);
            const setCookie = String(response?.headers?.["set-cookie"] ?? "");
            expect(setCookie).to.include("HttpOnly");
            expect(setCookie).to.include("SameSite=Lax");
        });

        cy.request("GET", "/api/users/me").its("status").should("eq", 200);
        cy.url().should("include", "/dashboard");
    });
});
