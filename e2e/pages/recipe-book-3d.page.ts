import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object de `features/recipe-book/book-3d` (`app-recipe-book-3d`) en su modo
 * **3D con WebGL**: canvas del libro, barra inferior de páginas, botón flotante
 * contextual (`＋ Nuevo «Categoría»` o `Insumos`), panel de índice y la región
 * `aria-live` que describe el spread visible.
 *
 * Para el modo sin WebGL (lista DOM) usa {@link RecipeBookFallbackPage}.
 */
export class RecipeBook3dPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-recipe-book-3d');
  readonly canvas = this.root.locator('canvas');
  readonly back = this.root.getByRole('button', { name: 'Volver' });
  readonly title = this.root.getByText('Mi libro de recetas');

  /** Región `aria-live`: el único texto accesible de lo que se ve en la hoja 3D. */
  readonly announce = this.root.locator('[role="status"][aria-live="polite"]');

  readonly pager = this.root.locator('nav[aria-label="Páginas del libro"]');
  readonly prev = this.pager.getByRole('button', { name: 'Página anterior' });
  readonly next = this.pager.getByRole('button', { name: 'Página siguiente' });
  readonly indexToggle = this.pager.getByRole('button', { name: 'Índice' });

  /** Botón flotante primario: `Nuevo «Categoría»` en páginas de categoría. */
  readonly newRecipe = this.root.locator('button[aria-label^="Nuevo "]');
  /** Botón flotante primario: `Insumos` en la sección de Insumos. */
  readonly manageSupplies = this.root.getByRole('button', { name: 'Gestionar insumos' });

  readonly indexPanel = this.page.locator('nav[aria-label="Índice de recetas"]');
  readonly indexClose = this.indexPanel.getByRole('button', { name: 'Cerrar índice' });
  /**
   * Entradas navegables del índice: los botones **con rótulo** del panel (las categorías son
   * rótulos `<p>`, no botones). El filtro por texto excluye la × de cerrar de la cabecera, que
   * es icon-only y toma su nombre accesible del `aria-label`, no de texto propio.
   */
  readonly indexRecipes = this.indexPanel.getByRole('button').filter({ hasText: /\S/ });

  /** Etiqueta de categoría dentro del índice (no es navegable: es un rótulo). */
  indexSection(name: string): Locator {
    return this.indexPanel.getByText(name, { exact: true });
  }

  /** Entrada de receta del índice → salta a su página. */
  indexRecipe(name: string): Locator {
    return this.indexRecipes.filter({ hasText: name }).first();
  }

  /** Espera a que el libro esté montado y con el primer spread asentado (portada). */
  async waitReady(): Promise<void> {
    await expect(this.canvas).toBeVisible();
    await expect(this.announce).toHaveText('Portada');
  }

  /**
   * Pasa página y espera a que el spread **cambie** (el motor encola y anima los
   * volteos; el texto de `aria-live` solo se actualiza al asentar).
   */
  async goNext(): Promise<void> {
    const before = await this.announce.innerText();
    await this.next.click();
    await expect(this.announce).not.toHaveText(before);
  }

  async goPrev(): Promise<void> {
    const before = await this.announce.innerText();
    await this.prev.click();
    await expect(this.announce).not.toHaveText(before);
  }

  /**
   * Avanza hasta la primera cara con receta (la que pinta overlays DOM). Desde la
   * portada son 2 volteos en escritorio (divisor de categoría → 1ª receta) y 2 en
   * móvil (una cara por volteo), así que se comprueba por presencia de overlay.
   */
  async goToFirstRecipe(): Promise<void> {
    const overlays = this.page.locator('app-recipe-overlay');
    for (let turn = 0; turn < 6 && (await overlays.count()) === 0; turn++) {
      await this.goNext();
    }
    await expect(overlays.first()).toBeVisible();
  }

  /**
   * Avanza hasta la cara de una receta concreta, detectándola por su overlay DOM (el único
   * contenido accesible de la hoja). Las recetas van por categoría y, dentro de cada una, en
   * orden alfabético, así que basta con pasar páginas hacia adelante.
   *
   * Se pasa página a mano (y no se salta desde el índice) para ejercitar la navegación real del
   * libro; el salto desde el índice se cubre en `specs/recipe-book/book-3d/index-panel.spec.ts`.
   */
  async goToRecipe(name: string): Promise<void> {
    const target = this.page
      .locator('app-recipe-overlay')
      .filter({ has: this.page.getByRole('heading', { level: 2, name, exact: true }) });
    // Se pasa página con `goNext()` (espera a que el spread ASIENTE): los overlays se vacían al
    // voltear y solo se repueblan al asentar, así que encolar volteos dejaría la hoja sin overlay.
    for (let turn = 0; turn < 30 && (await target.count()) === 0; turn++) {
      if (await this.next.isDisabled()) {
        break;
      }
      await this.goNext();
    }
    await expect(target.first()).toBeVisible();
  }

  /**
   * Avanza hasta la sección de **Insumos** (la última del libro), detectable por su
   * botón flotante propio. Los volteos se encolan, así que se pulsa seguido.
   */
  async goToSuppliesSection(): Promise<void> {
    for (let turn = 0; turn < 25 && (await this.manageSupplies.count()) === 0; turn++) {
      if (await this.next.isDisabled()) {
        break;
      }
      await this.next.click();
      await this.page.waitForTimeout(300); // el motor acelera los volteos encolados
    }
    await expect(this.manageSupplies).toBeVisible();
  }
}
