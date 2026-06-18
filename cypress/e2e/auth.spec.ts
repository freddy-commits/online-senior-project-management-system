describe('Authentication & Landing Page Spec', () => {
  it('should load the landing page successfully', () => {
    cy.visit('/')
    cy.contains('Project Station').should('be.visible')
    cy.contains('Access Workspaces').should('be.visible')
  })

  it('should navigate to the login page', () => {
    cy.visit('/')
    cy.contains('Login').click()
    cy.url().should('include', '/login')
    cy.contains('Welcome Back').should('be.visible')
  })
})
