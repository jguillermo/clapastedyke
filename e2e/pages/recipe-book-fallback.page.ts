import { expect, type Locator, type Page } from '@playwright/test';
import type { CategoryName } from '../support/seed';

/**
 * Page object de `features/recipe-book/book-3d` en su **ruta accesible sin WebGL**:
 * una lista DOM con una sección por categoría (título + botón `Nuevo`), un botón por
 * receta que abre el formulario de edición, y el botón `Insumos` al final.
 *
 * Es la vista donde se ejercitan los flujos de negocio: mismas acciones que el 3D,
 * pero determinista y sin GPU.
 */
export class RecipeBookFallbackPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-recipe-book-3d');
  readonly title = this.root.getByText('Mi libro de recetas');
  readonly back = this.root.getByRole('button', { name: 'Volver' });
  readonly suppliesButton = this.root.getByRole('button', { name: 'Insumos' });

  /**
   * Todas las cabeceras de categoría, en el orden en que se pintan.
   *
   * Se localizan por elemento (`h2`) y no por rol: mientras un `MigoDialog` se está
   * desmontando, el CDK mantiene un instante el `aria-hidden` del resto del
   * documento, y una consulta por rol no encontraría nada.
   */
  readonly categoryHeadings = this.root.locator('h2');

  /** Sección de una categoría (contiene su `h2`, su `Nuevo` y sus recetas). */
  category(name: CategoryName | string): Locator {
    return this.root.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: exactText(name) }),
    });
  }

  /** Botón `Nuevo` de una categoría → abre el formulario de crear receta ahí. */
  newRecipeIn(category: CategoryName | string): Locator {
    return this.category(category).getByRole('button', { name: 'Nuevo' });
  }

  /**
   * Filas de receta de una categoría. Son los `button` que la sección pinta como
   * hijos directos (el `Nuevo` va anidado en la cabecera, así que no entra).
   */
  recipeRows(category: CategoryName | string): Locator {
    return this.category(category).locator('> button');
  }

  /** Fila de una receta concreta → abre su formulario de edición. */
  recipe(category: CategoryName | string, name: string): Locator {
    return this.recipeRows(category).filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  /**
   * Badges de características (Sabor/Porciones/Molde) que pinta la fila de una receta.
   *
   * Se localizan por el elemento del design system y no por rol: `migo-badge` no expone
   * ninguno (es texto decorado), y lo que los tests cuentan es cuántas características
   * tiene la receta.
   */
  recipeBadges(category: CategoryName | string, name: string): Locator {
    return this.recipe(category, name).locator('migo-badge');
  }

  /** Nombres de las recetas listadas en una categoría, en el orden en que se pintan. */
  async recipeNamesIn(category: CategoryName | string): Promise<string[]> {
    return this.recipeRows(category).evaluateAll((rows) =>
      rows.map((row) => row.querySelector('span')?.textContent?.trim() ?? ''),
    );
  }

  /** Espera a que el catálogo esté pintado (el `ListRecipeBook` ya resolvió). */
  async waitReady(): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.categoryHeadings.first()).toBeVisible();
  }
}

/** Regex que exige coincidencia exacta del texto de un elemento. */
function exactText(value: string): RegExp {
  return new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}
