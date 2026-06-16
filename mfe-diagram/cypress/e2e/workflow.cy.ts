describe('cross-mfe selection sync', () => {
  it('clicking a table row highlights the corresponding diagram block', () => {
    cy.visit('/');

    cy.get('[data-testid="workflow-row"]').first().click();

    cy.get('[data-testid="diagram-block"]').first().should('have.css', 'border-style', 'dashed');
  });
});
