Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[id="email"]').type(email);
  cy.get('input[id="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

export {};
