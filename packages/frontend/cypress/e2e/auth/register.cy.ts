import { uniqueEmail, validPassword } from "../../support/e2e";

describe("Parcours Inscription (Register)", () => {
    const registerFormUI = {
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
    });

    it("bloque la soumission quand l'email est invalide (validation native)", () => {
        cy.visit("/auth/register");

        cy.get(registerFormUI.firstName).type("John");
        cy.get(registerFormUI.lastName).type("Doe");
        cy.get(registerFormUI.email).type("not-an-email");
        cy.get(registerFormUI.password).type(validPassword);
        cy.get(registerFormUI.confirm).type(validPassword);

        cy.intercept("POST", "/api/auth/register").as("register");

        cy.contains(
            'button[type="submit"]',
            registerFormUI.submitBtnLabel,
        ).click();

        cy.get(registerFormUI.email).should("match", ":invalid");
        cy.get("@register.all").should("have.length", 0);
    });

    it("affiche une erreur si les mots de passe ne correspondent pas (email valide)", () => {
        cy.visit("/auth/register");

        cy.fillRegisterForm({
            firstname: "John",
            lastname: "Doe",
            email: "john.doe@example.com",
        });
        cy.get(registerFormUI.password).type(validPassword);
        cy.get(registerFormUI.confirm).type(validPassword + "x");

        cy.intercept("POST", "/api/auth/register").as("register");

        cy.contains(
            'button[type="submit"]',
            registerFormUI.submitBtnLabel,
        ).click();

        cy.get("@register.all").should("have.length", 0);
        cy.get(registerFormUI.formError)
            .should("be.visible")
            .and("contain", "Les mots de passe ne correspondent pas");
    });

    it("crée un compte et prouve l'auth via /api/users/me", () => {
        cy.visit("/auth/register");

        const email = uniqueEmail("planify");

        cy.fillRegisterForm({
            firstname: "Alice",
            lastname: "Martin",
            email,
            password: validPassword,
        });

        cy.intercept("POST", "/api/auth/register").as("register");

        cy.contains(
            'button[type="submit"]',
            registerFormUI.submitBtnLabel,
        ).click();

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
                firstname: "Bob",
                lastname: "Durand",
                email,
                password: validPassword,
            });
            cy.contains(
                'button[type="submit"]',
                registerFormUI.submitBtnLabel,
            ).click();
        };

        cy.intercept("POST", "/api/auth/register").as("register1");
        fillAndSubmit();
        cy.wait("@register1").its("response.statusCode").should("eq", 201);

        cy.request("POST", "/api/auth/logout").its("status").should("eq", 200);

        cy.intercept("POST", "/api/auth/register").as("register2");
        fillAndSubmit();
        cy.wait("@register2").its("response.statusCode").should("eq", 400);
        cy.get(registerFormUI.formError)
            .should("be.visible")
            .and("contain", "Cet email est déjà utilisé.");
    });
});
