import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object de `features/recipe-book/book-3d/recipe-overlay` (`app-recipe-overlay`):
 * el contenido DOM de una receta colocado sobre la hoja del libro 3D. Título fijo
 * (nombre + editar + badges de sabor/porciones/molde) y cuerpo scrolleable con las
 * líneas de insumo, el contador y el total.
 *
 * En escritorio hay hasta **dos** overlays (spread); en móvil uno (single page).
 */
export class RecipeOverlayPage {
  constructor(private readonly page: Page) {}

  readonly all = this.page.locator('app-recipe-overlay');

  /** El overlay de un lado del spread (0 = izquierda / única, 1 = derecha). */
  at(index = 0): Locator {
    return this.all.nth(index);
  }

  /** Overlay de una receta concreta por su título. */
  byName(name: string): Locator {
    return this.all.filter({ has: this.page.getByRole('heading', { level: 2, name }) });
  }

  title(index = 0): Locator {
    return this.at(index).getByRole('heading', { level: 2 });
  }

  editButton(index = 0): Locator {
    return this.at(index).getByRole('button', { name: 'Editar receta' });
  }

  badges(index = 0): Locator {
    return this.at(index).locator('migo-badge');
  }

  lines(index = 0): Locator {
    return this.at(index).locator('ul > li');
  }

  /** Cuerpo scrolleable (el título queda fijo fuera de él). */
  scrollBody(index = 0): Locator {
    return this.at(index).locator('div.overflow-y-auto');
  }

  /** Títulos de todos los overlays visibles, en orden de spread. */
  async titles(): Promise<string[]> {
    return this.all.getByRole('heading', { level: 2 }).allInnerTexts();
  }

  /** Total de la receta ya formateado por el negocio (`PreviewRecipeCost`). */
  async total(index = 0): Promise<string> {
    const text = await this.at(index).innerText();
    return text.split('TOTAL').pop()?.trim() ?? '';
  }

  /** Desliza horizontalmente sobre el overlay para pasar página. */
  async swipe(direction: 'next' | 'prev', index = 0): Promise<void> {
    const box = await this.at(index).boundingBox();
    expect(box, 'el overlay debe estar colocado sobre la hoja').not.toBeNull();
    const y = box!.y + box!.height * 0.6;
    const from = box!.x + box!.width * (direction === 'next' ? 0.75 : 0.25);
    const to = from + (direction === 'next' ? -160 : 160);
    await this.page.mouse.move(from, y);
    await this.page.mouse.down();
    await this.page.mouse.move(to, y, { steps: 10 });
    await this.page.mouse.up();
  }
}
