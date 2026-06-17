import { test, expect } from '@playwright/test';

test.describe('App boots', () => {
  test('/ → redirige a /home → canvas del mundo 3D visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/home');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('/ui → showcase de componentes carga sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/ui');
    await expect(page.locator('body')).not.toBeEmpty();

    expect(errors).toHaveLength(0);
  });
});
