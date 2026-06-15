import { test, expect } from '@playwright/test';

// Modo 2: tests exhaustivos de componente — un describe por componente, un test por estado/variante.
// No aplica la regla de "terminal state": el objetivo es cobertura de estados, no de flujos.
// Naming: "<componente> <estado/variante> → <resultado observable>"

test.describe('Button component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ui');
  });

  test('variant primary → visible con rol button semántico', async ({ page }) => {
    const btn = page.locator('[data-test-id="button-primary"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveRole('button');
  });

  test('loading trigger → click → entra en estado loading → vuelve a idle', async ({ page }) => {
    const btn = page.locator('[data-test-id="button-loading-trigger"]');
    await btn.click();
    await expect(btn).toHaveText('Guardando…');
    // Revierte automáticamente tras 1500ms
    await expect(btn).toHaveText('Simular carga', { timeout: 3000 });
  });

  test('disabled → no es interactuable', async ({ page }) => {
    const btn = page.locator('[data-test-id="button-disabled"]');
    await expect(btn).toBeDisabled();
  });

  // Añadir un test por cada variante adicional: secondary, ghost, danger, sizes, block…
});
