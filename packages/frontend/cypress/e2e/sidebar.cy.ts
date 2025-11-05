import { uniqueEmail, validPassword } from "../support/e2e";

describe("Sidebar - éléments, navigation et déconnexion", () => {
    const ui = {
        aside: 'aside[aria-label="Navigation principale"]',
        logoAlt: 'img[alt="Planify"]',
        linkTaches: "Taches",
        linkContacts: "Contacts",
        linkCompte: "Compte",
        btnLogout: "Déconnexion",
    };

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
                .and("have.attr", "href", "tasks");
            cy.contains("a", ui.linkContacts)
                .should("exist")
                .and("have.attr", "href", "contacts");
            cy.contains("a", ui.linkCompte)
                .should("exist")
                .and("have.attr", "href", "account");
            cy.contains("button", ui.btnLogout).should("exist");
        });
    });

    it("redirige correctement en cliquant sur Taches, Contacts et Compte", () => {
        cy.contains("a", ui.linkTaches).click();
        cy.url().should("include", "/tasks");

        cy.visit("/dashboard");

        cy.contains("a", ui.linkContacts).click();
        cy.url().should("include", "/contacts");

        cy.visit("/dashboard");

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
