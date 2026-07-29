import { type Locator, type Page } from '@playwright/test';

/**
 * Page object de `features/recipe-book/_shared/price-capture` (`app-price-capture`):
 * el popover en línea que fija el **costo de compra** de un insumo.
 *
 * Dos campos (`Compras` = presentación, `Precio`) y una línea viva «Te cuesta …»
 * que calcula el negocio (`PreviewSupplyCost`). `Listo` queda deshabilitado hasta
 * que la compra es válida; se cierra con `Cancelar`, con Escape o al confirmar.
 */
export class PriceCapturePage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-price-capture');
  readonly heading = this.root.getByText('¿Cómo compras');
  readonly packaging = this.root.getByLabel('Compras');
  readonly price = this.root.getByLabel('Precio');
  readonly confirm = this.root.getByRole('button', { name: 'Listo' });
  readonly cancel = this.root.getByRole('button', { name: 'Cancelar' });

  /** Línea `aria-live` con el costo por unidad base («Te cuesta S/ 0.0160 por g»). */
  readonly perBaseUnit = this.root.locator('[aria-live="polite"]');

  /** Chip de unidad del campo de presentación (`g`, `kg`, `u`). */
  readonly packagingUnit = this.root.locator('migo-unit-input');

  /** Rellena la compra y confirma. */
  async setPurchase(packaging: string, price: string): Promise<void> {
    await this.packaging.fill(packaging);
    await this.price.fill(price);
    await this.confirm.click();
  }

  /** Título del popover, que incluye el nombre del insumo. */
  forSupply(name: string): Locator {
    return this.root.getByText(`¿Cómo compras "${name}"?`);
  }
}
