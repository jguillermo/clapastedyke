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

  /** Panel del overlay de CDK que lo hospeda (full-bleed en móvil). */
  readonly panel = this.page.locator('.migo-dialog__panel.cdk-overlay-pane');
  readonly header = this.root.locator('migo-card-header');
  /** Cuerpo del card: la única zona scrollable cuando el card está en `fill`. */
  readonly body = this.root.locator('migo-card-body');

  /** La lista editable que vive dentro del diálogo. */
  readonly list = new SupplyListPage(this.page);

  async waitReady(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.title).toHaveText('Insumos');
    await expect(this.list.table).toBeVisible();
  }

  /**
   * Cierra el diálogo pulsando el backdrop **en una esquina**: el panel va centrado y
   * tapa el centro del backdrop, así que un clic al medio caería sobre el propio panel.
   * El backdrop lo genera el CDK fuera de todo componente y no tiene rol ni nombre
   * accesible; se localiza por la clase que le pone el chrome de `MigoDialog`.
   */
  async closeByBackdrop(): Promise<void> {
    await this.page.locator('.migo-dialog__backdrop').click({ position: { x: 4, y: 4 } });
  }

  /**
   * Espera a que el diálogo se haya cerrado **por completo**: el CDK retira su panel del overlay y
   * devuelve el `aria-hidden` al resto del documento (sin eso, una consulta por rol sobre el libro
   * que queda debajo podría no encontrar nada).
   */
  async waitClosed(): Promise<void> {
    await expect(this.root).toHaveCount(0);
    await expect(this.page.locator('.cdk-overlay-pane')).toHaveCount(0);
  }
}
