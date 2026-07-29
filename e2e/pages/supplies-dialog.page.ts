import { expect, type Page } from '@playwright/test';
import { SupplyListPage } from './supply-list.page';

/**
 * Page object de `features/recipe-book/supplies-dialog` (`app-supplies-dialog`): el
 * shell de diálogo que hospeda la lista editable de insumos.
 *
 * Solo aporta cabecera («Insumos» + × de cerrar) y el cuerpo con
 * {@link SupplyListPage}. Al cerrar devuelve si hubo cambios, y el libro recarga.
 */
export class SuppliesDialogPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-supplies-dialog');
  readonly title = this.root.locator('migo-card-title');
  readonly close = this.root.getByRole('button', { name: 'Cerrar' });

  /** La lista editable que vive dentro del diálogo. */
  readonly list = new SupplyListPage(this.page);

  async waitReady(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.title).toHaveText('Insumos');
    await expect(this.list.table).toBeVisible();
  }
}
