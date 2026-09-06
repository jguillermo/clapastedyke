import { expect } from '@playwright/test';
import type { AccountPage } from '../pages/account.page';
import type { HomePage } from '../pages/home.page';
import type { RecipeBookFallbackPage } from '../pages/recipe-book-fallback.page';
import type { SuppliesDialogPage } from '../pages/supplies-dialog.page';

/**
 * Los caminos largos de la app, para las pestañas que no son la principal.
 *
 * El fixture `openSuppliesDialog` hace esto mismo, pero está atado a `page`: en cuanto un spec tiene
 * una segunda pestaña o un segundo aparato hace falta el mismo recorrido sobre **otros** page
 * objects. Sin esto, cada spec que use dos navegadores se copia la secuencia.
 *
 * Van aquí y no en el fixture porque reciben sobre quién actuar, igual que `clearLocalDatabases`.
 */

/** Lo que hace falta para ir y volver entre `/cuenta` y el diálogo de Insumos. */
export interface Surface {
  readonly account: AccountPage;
  readonly home: HomePage;
  readonly catalog: RecipeBookFallbackPage;
  readonly supplies: SuppliesDialogPage;
}

/** `/home` → libro de recetas → diálogo de Insumos. */
export async function openSupplies(surface: Surface): Promise<void> {
  await surface.home.goto();
  await surface.home.station('Libro de recetas').click();
  await surface.catalog.waitReady();
  await surface.catalog.suppliesButton.click();
  await surface.supplies.waitReady();
}

/**
 * El camino de vuelta a `/cuenta` **por navegación de la app**, sin recargar.
 *
 * Que no haya recarga importa: recargar vuelve a arrancar la app y reanuda la sesión desde cero, lo
 * que tapa cualquier desajuste que se estuviera comprobando (ver `tabs.spec.ts`).
 */
export async function backToAccount(surface: Surface): Promise<void> {
  await surface.supplies.close.click();
  await surface.supplies.waitClosed();
  await surface.catalog.back.click();
  await expect(surface.home.dock).toBeVisible();
  await surface.home.accountLink.click();
  await expect(surface.account.root).toBeVisible();
}
