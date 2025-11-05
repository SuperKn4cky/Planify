// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
    namespace Cypress {
        interface Chainable {
            fillRegisterForm(user: any): Chainable<void>;
        }
    }
}

export const validPassword = "Secure123456@";
export const uniqueEmail = (prefix = "user") => {
    const ts = Date.now();
    return `${prefix}.${ts}@example.com`;
};
