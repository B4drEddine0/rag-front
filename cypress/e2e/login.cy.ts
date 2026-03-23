describe('User Login E2E Test', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should successfully login with valid credentials', () => {
    cy.get('input[id="email"]').type('admin@school.com');
    cy.get('input[id="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should display login page elements', () => {
    cy.contains('Sign in').should('exist');
    cy.get('input[id="email"]').should('exist');
    cy.get('input[id="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should toggle password visibility', () => {
    cy.get('input[id="password"]').should('have.attr', 'type', 'password');
    
    cy.get('.password-toggle').should('exist').click();
    
    cy.get('input[id="password"]').should('have.attr', 'type', 'text');
    
    cy.get('.password-toggle').click();
    
    cy.get('input[id="password"]').should('have.attr', 'type', 'password');
  });

  it('should navigate to register page', () => {
    cy.contains('Create one').click();
    cy.url().should('include', '/register');
  });
});
