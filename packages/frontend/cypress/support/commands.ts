/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
Cypress.Commands.add("fillRegisterForm", (user) => {
    if (user.firstname) {
        cy.get("#first_name").type(user.firstname);
    }
    if (user.lastname) {
        cy.get("#last_name").type(user.lastname);
    }
    if (user.email) {
        cy.get("#email").type(user.email);
    }
    if (user.password) {
        cy.get("#password").type(user.password);
        cy.get("#confirm").type(user.password);
    }
});
