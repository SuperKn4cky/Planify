import { uniqueEmail, validPassword } from "../support/e2e";

describe("/account - profil, MAJ, logout-all, suppression", () => {
    const ui = {
        first: "#first_name",
        last: "#last_name",
        email: "#email",
    };

    beforeEach(() => {
        cy.clearCookies();
    });

    const registerAndLogin = () => {
        const email = uniqueEmail("account");
        cy.visit("/auth/register");
        cy.fillRegisterForm({
            firstname: "John",
            lastname: "Doe",
            email,
            password: validPassword,
        });
        cy.intercept("POST", "/api/auth/register").as("register");
        cy.contains('button[type="submit"]', "Créer le compte").click();
        cy.wait("@register").its("response.statusCode").should("eq", 201);
        return email;
    };

    it("tous les inputs et boutons sont présents et visibles", () => {
        registerAndLogin();

        cy.intercept("GET", "/api/users/me").as("me");
        cy.visit("/account");
        cy.wait("@me").its("response.statusCode").should("eq", 200);

        cy.get('main, [role="main"]')
            .first()
            .within(() => {
                cy.get("#first_name").should("be.visible");
                cy.get("#last_name").should("be.visible");
                cy.get("#email").should("be.visible");

                cy.get('form button[type="submit"]').should("be.visible");

                cy.contains("button", "Réinitialiser le mot de passe").should(
                    "be.visible",
                );
                cy.contains("button", "Déconnecter tous les appareils").should(
                    "be.visible",
                );
                cy.contains("button", "Supprimer mon compte").should(
                    "be.visible",
                );
            });
    });

    it("présence et auto-remplissage des champs du profil", () => {
        const email = registerAndLogin();

        cy.intercept("GET", "/api/users/me").as("me");
        cy.visit("/account");
        cy.wait("@me").its("response.statusCode").should("eq", 200);

        cy.get(ui.first).should("be.visible").and("have.value", "John");
        cy.get(ui.last).should("be.visible").and("have.value", "Doe");
        cy.get(ui.email).should("be.visible").and("have.value", email);
    });

    it("mise à jour des champs (PUT /api/users/me) et persistance", () => {
        registerAndLogin();

        cy.intercept("GET", "/api/users/me").as("me");
        cy.visit("/account");
        cy.wait("@me").its("response.statusCode").should("eq", 200);

        const updated = {
            first: "Johnny",
            last: "Doerz",
            email: uniqueEmail("new"),
        };

        cy.get(ui.first).clear().type(updated.first);
        cy.get(ui.last).clear().type(updated.last);
        cy.get(ui.email).clear().type(updated.email);

        cy.intercept("PUT", "/api/users/me").as("update");
        cy.get("form").submit();
        cy.wait("@update").its("response.statusCode").should("eq", 204);

        cy.request("GET", "/api/users/me").then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property("first_name", updated.first);
            expect(res.body).to.have.property("last_name", updated.last);
            expect(res.body).to.have.property("email", updated.email);
        });
    });

    it("déconnexion de toutes les sessions via le bouton (POST /api/auth/logout-all)", () => {
        registerAndLogin();

        cy.visit("/account");
        cy.intercept("POST", "/api/auth/logout-all").as("logoutAll");

        cy.contains("button", "Déconnecter tous les appareils").click();

        cy.get('[role="dialog"]')
            .should("be.visible")
            .contains("button", "Déconnecter")
            .click();

        cy.wait("@logoutAll").its("response.statusCode").should("eq", 200);
        cy.url().should("include", "/auth/login");

        cy.request({
            method: "GET",
            url: "/api/users/me",
            failOnStatusCode: false,
        })
            .its("status")
            .should("eq", 401);
    });

    it("suppression du compte via le bouton (DELETE /api/users/me)", () => {
        registerAndLogin();

        cy.visit("/account");
        cy.intercept("DELETE", "/api/users/me").as("delMe");

        cy.contains("button", "Supprimer mon compte").click();

        cy.get('[role="dialog"]')
            .should("be.visible")
            .contains("button", "Supprimer")
            .click();

        cy.wait("@delMe").its("response.statusCode").should("eq", 200);
        cy.url().should("include", "auth/register");

        cy.request({
            method: "GET",
            url: "/api/users/me",
            failOnStatusCode: false,
        })
            .its("status")
            .should("eq", 401);
    });

    it("réinitialisation du mot de passe", () => {
        // todo
    });
});
