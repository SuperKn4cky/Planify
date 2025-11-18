import { uniqueEmail, validPassword } from "../support/e2e";

describe("Sidebar - éléments, navigation et déconnexion", () => {
    const ui = {
        aside: 'aside[aria-label="Navigation principale"]',
        logoAlt: 'img[alt="Planify"]',
        linkTaches: "Tâches",
        linkContacts: "Contacts",
        linkCompte: "Compte",
        linkConnexion: "Connexion",
        linkInscription: "Inscription",
        btnLogout: "Déconnexion",
    };

    describe("quand l'utilisateur est authentifié", () => {
        beforeEach(() => {
            cy.clearCookies();

            const email = uniqueEmail("sidebar");
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

            cy.visit("/dashboard");
        });

        it("affiche tous les éléments attendus (logo, liens, bouton déconnexion)", () => {
            cy.get(ui.aside).within(() => {
                cy.get(ui.logoAlt).should("be.visible");

                cy.contains("a", ui.linkTaches)
                    .should("exist")
                    .and("have.attr", "href", "/dashboard");

                cy.contains("a", ui.linkContacts)
                    .should("exist")
                    .and("have.attr", "href", "/contacts");

                cy.contains("a", ui.linkCompte)
                    .should("exist")
                    .and("have.attr", "href", "/account");

                cy.contains("button", ui.btnLogout).should("exist");

                cy.contains("a", ui.linkConnexion).should("not.exist");
                cy.contains("a", ui.linkInscription).should("not.exist");
            });
        });

        it("redirige correctement en cliquant sur Tâches, Contacts et Compte", () => {
            cy.contains("a", ui.linkTaches).click();
            cy.url().should("include", "/dashboard");

            cy.visit("/");
            cy.contains("a", ui.linkContacts).click();
            cy.url().should("include", "/contacts");

            cy.visit("/");
            cy.contains("a", ui.linkCompte).click();
            cy.url().should("include", "/account");
        });

        it("déconnecte l'utilisateur et redirige vers /auth/login", () => {
            cy.intercept("POST", "/api/auth/logout").as("logout");
            cy.contains("button", ui.btnLogout).click();
            cy.wait("@logout").its("response.statusCode").should("eq", 200);
            cy.url().should("include", "/auth/login");

            cy.request({
                method: "GET",
                url: "/api/users/me",
                failOnStatusCode: false,
            })
                .its("status")
                .should("eq", 401);
        });
    });

    describe("quand l'utilisateur est non authentifié", () => {
        beforeEach(() => {
            cy.clearCookies();
            cy.visit("/");
        });

        it("affiche Connexion / Inscription mais pas Compte / Déconnexion", () => {
            cy.get(ui.aside).within(() => {
                cy.contains("a", ui.linkConnexion)
                    .should("exist")
                    .and("have.attr", "href", "/auth/login");

                cy.contains("a", ui.linkInscription)
                    .should("exist")
                    .and("have.attr", "href", "/auth/register");

                cy.contains("a", ui.linkCompte).should("not.exist");
                cy.contains("button", ui.btnLogout).should("not.exist");
            });
        });

        it("redirige vers /auth/login et /auth/register depuis la sidebar invitée", () => {
            cy.contains("a", ui.linkConnexion).click();
            cy.url().should("include", "/auth/login");

            cy.visit("/");

            cy.contains("a", ui.linkInscription).click();
            cy.url().should("include", "/auth/register");
        });
    });
});
