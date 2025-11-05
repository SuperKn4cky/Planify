import { uniqueEmail, validPassword } from "../../support/e2e";

describe("Parcours Inscription (Register)", () => {
    const ui = {
        firstName: "#first_name",
        lastName: "#last_name",
        email: "#email",
        password: "#password",
        confirm: "#confirm",
        submitBtnLabel: "Créer le compte",
        formError: "#form-error",
    };

    beforeEach(() => {
        cy.clearCookies();
        cy.visit("/auth/register");
    });

    it("bloque la soumission quand l'email est invalide ", () => {
        cy.get(ui.firstName).type("John");
        cy.get(ui.lastName).type("Doe");
        cy.get(ui.email).type("not-an-email");
        cy.get(ui.password).type(validPassword);
        cy.get(ui.confirm).type(validPassword);

        cy.intercept("POST", "/api/auth/register").as("register");

        cy.contains('button[type="submit"]', ui.submitBtnLabel).click();

        cy.get(ui.formError)
            .should("be.visible")
            .and("contain", "Email invalide");
        cy.get("@register.all").should("have.length", 0);
    });

    it("affiche une erreur si les mots de passe ne correspondent pas", () => {
        cy.fillRegisterForm({
            firstname: "John",
            lastname: "Doe",
            email: "john.doe@example.com",
        });
        cy.get(ui.password).type(validPassword);
        cy.get(ui.confirm).type(validPassword + "x");

        cy.intercept("POST", "/api/auth/register").as("register");

        cy.contains('button[type="submit"]', ui.submitBtnLabel).click();

        cy.get("@register.all").should("have.length", 0);
        cy.get(ui.formError)
            .should("be.visible")
            .and("contain", "Les mots de passe ne correspondent pas");
    });

    it("crée un compte et prouve l'auth via /api/users/me", () => {
        const email = uniqueEmail("planify");

        cy.fillRegisterForm({
            firstname: "John",
            lastname: "Doe",
            email,
            password: validPassword,
        });

        cy.intercept("POST", "/api/auth/register").as("register");

        cy.contains('button[type="submit"]', ui.submitBtnLabel).click();

        cy.wait("@register").its("response.statusCode").should("eq", 201);

        cy.request("GET", "/api/users/me").then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property("email", email);
        });
    });

    it("renvoie une erreur lisible pour un email déjà utilisé", () => {
        const email = uniqueEmail("dup");

        const fillAndSubmit = () => {
            cy.visit("/auth/register");
            cy.fillRegisterForm({
                firstname: "John",
                lastname: "Doe",
                email,
                password: validPassword,
            });
            cy.contains('button[type="submit"]', ui.submitBtnLabel).click();
        };

        cy.intercept("POST", "/api/auth/register").as("register1");
        fillAndSubmit();
        cy.wait("@register1").its("response.statusCode").should("eq", 201);

        cy.request("POST", "/api/auth/logout").its("status").should("eq", 200);

        cy.intercept("POST", "/api/auth/register").as("register2");
        fillAndSubmit();
        cy.wait("@register2").its("response.statusCode").should("eq", 400);
        cy.get(ui.formError)
            .should("be.visible")
            .and("contain", "Cet email est déjà utilisé.");
    });
});
