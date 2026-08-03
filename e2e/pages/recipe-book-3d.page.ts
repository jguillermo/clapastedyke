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
  /*
   * Las acciones se exigen con `exact: true`: los overlays de receta viven bajo esta misma raíz
   * y `getByRole` coincide por SUBCADENA, así que una receta llamada «Volver a empezar» o
   * «Gestionar insumos del taller» haría que el locator resolviera a dos elementos.
   */
  readonly back = this.root.getByRole('button', { name: 'Volver', exact: true });
  readonly title = this.root.getByText('Mi libro de recetas');

  /** Región `aria-live`: el único texto accesible de lo que se ve en la hoja 3D. */
  readonly announce = this.root.locator('[role="status"][aria-live="polite"]');

  readonly pager = this.root.locator('nav[aria-label="Páginas del libro"]');
  readonly prev = this.pager.getByRole('button', { name: 'Página anterior', exact: true });
  readonly next = this.pager.getByRole('button', { name: 'Página siguiente', exact: true });
  readonly indexToggle = this.pager.getByRole('button', { name: 'Índice', exact: true });

  /** Botón flotante primario: `Nuevo «Categoría»` en páginas de categoría. */
  readonly newRecipe = this.root.locator('button[aria-label^="Nuevo "]');
  /** Botón flotante primario: `Insumos` en la sección de Insumos. */
  readonly manageSupplies = this.root.getByRole('button', {
    name: 'Gestionar insumos',
    exact: true,
  });

  readonly indexPanel = this.page.locator('nav[aria-label="Índice de recetas"]');
  readonly indexClose = this.indexPanel.getByRole('button', { name: 'Cerrar índice', exact: true });
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

  /**
   * Entradas del índice con ese nombre **exacto** → saltan a su página.
   *
   * Devuelve un locator que puede resolver a **más de una**, y es a propósito: hay recetas
   * homónimas en categorías distintas («Crema Chantilly» y «Ganache de Chocolate» están en
   * Rellenos y en Coberturas), así que un `.first()` escondido aquí haría que un test de
   * cobertura del índice pasara aunque faltara una de las dos. Quien necesite pulsar una
   * concreta elige cuál (ver {@link jumpToRecipe}); quien cuente, cuenta de verdad.
   */
  indexRecipe(name: string): Locator {
    return this.indexPanel.getByRole('button', { name, exact: true });
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
   * libro; el salto desde el índice se cubre en `specs/recipe-book/book-3d/book-3d.spec.ts` y se
   * reutiliza dentro de un journey con {@link jumpToRecipe}.
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
   * Salta a la página de una receta **desde el índice**, sin depender de dónde esté el libro.
   *
   * {@link goToRecipe} solo avanza, así que dentro de un journey que visita varias recetas la
   * segunda podría quedar por detrás y no alcanzarse nunca. El salto por índice es
   * bidireccional y es la navegación que el propio usuario tiene para eso (su mecánica se
   * cubre en `book-3d.spec.ts`).
   */
  async jumpToRecipe(name: string): Promise<void> {
    await this.indexToggle.click();
    await expect(this.indexPanel).toBeVisible();
    // `.first()` explícito: con recetas homónimas hay dos entradas y cualquiera vale para llegar
    // a una página de esa receta. Que la elección esté aquí y no escondida en el locator es lo
    // que permite que `indexRecipe` siga contando las dos (ver su JSDoc).
    await this.indexRecipe(name).first().click();
    await expect(this.indexPanel).toHaveCount(0);
    const target = this.page
      .locator('app-recipe-overlay')
      .filter({ has: this.page.getByRole('heading', { level: 2, name, exact: true }) });
    await expect(target.first()).toBeVisible();
  }

  /**
   * Va a la sección de **Insumos**, que es la **última** del libro: `End` salta ahí de una vez.
   *
   * Antes esto encolaba ~20 volteos con un `waitForTimeout(300)` entre pulsación y pulsación —
   * una espera fija, que es justo lo que las convenciones prohíben como sincronización: en una
   * máquina cargada el motor no había asentado en 300 ms y el bucle se pasaba de largo o se
   * quedaba corto. `End` es un solo salto y la espera es la aserción web-first de que el botón
   * flotante de la sección está ahí.
   */
  async goToSuppliesSection(): Promise<void> {
    await this.page.keyboard.press('End');
    await expect(this.manageSupplies).toBeVisible();
  }
}
