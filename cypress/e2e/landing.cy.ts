describe('Landing Page E2E Test', () => {
  it('should display landing page and navigate to login', () => {
    cy.visit('/');
    
    cy.contains('SchoolAI').should('be.visible');
    cy.contains('Transform Your School').should('be.visible');
    
    cy.contains('Sign In').click();
    cy.url().should('include', '/login');
  });

  it('should display all sections on landing page', () => {
    cy.visit('/');
    
    cy.get('.nav-link').should('have.length.at.least', 4);
    cy.contains('Features').should('be.visible');
    cy.contains('How It Works').should('be.visible');
    cy.contains('Testimonials').should('be.visible');
    cy.contains('Pricing').should('be.visible');
  });

  it('should navigate from landing page to register', () => {
    cy.visit('/');
    
    cy.contains('Get Started').click();
    cy.url().should('include', '/register');
  });
});
