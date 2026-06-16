describe('workflow table', () => {
  it('creates a new step and shows it in the table', () => {
    cy.visit('/');

    cy.get('[data-testid="workflow-row"]').then(($rows) => {
      const initialCount = $rows.length;

      cy.contains('Создать состояние').click();

      cy.get('[data-testid="workflow-row"]').should('have.length', initialCount + 1);
    });

    cy.get('input').last().invoke('val').should('match', /^Шаг \d+$/);
  });
});
