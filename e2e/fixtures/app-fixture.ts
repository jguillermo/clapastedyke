import { test as base, expect } from '@playwright/test';
import { DISABLE_WEBGL_SCRIPT } from '../support/webgl';
import { HomePage } from '../pages/home.page';
import { RecipeBook3dPage } from '../pages/recipe-book-3d.page';
import { RecipeBookFallbackPage } from '../pages/recipe-book-fallback.page';
import { RecipeOverlayPage } from '../pages/recipe-overlay.page';
import { RecipeFormPage } from '../pages/recipe-form.page';
import { SupplyGridPage } from '../pages/supply-grid.page';
import { PriceCapturePage } from '../pages/price-capture.page';
import { SuppliesDialogPage } from '../pages/supplies-dialog.page';
import { SupplyListPage } from '../pages/supply-list.page';

/** Opciones de configuración propias de esta suite. */
export interface AppOptions {
  /**
   * `false` (por defecto) anula WebGL: las vistas caen a su **ruta accesible DOM**,
   * que es determinista y rápida — el modo en el que se prueban los flujos de
   * negocio. Los specs del mundo/libro 3D declaran `test.use({ webgl: true })`.
   */
  webgl: boolean;
}

/** Page objects y helpers disponibles en cada test. */
export interface AppFixtures {
  /** Errores no capturados de la página; el test falla si hay alguno. */
  pageErrors: Error[];

  /** Lo que la app registró como `error`; el test falla si hay algo. */
  consoleErrors: string[];

  home: HomePage;
  /** El libro de recetas en modo 3D (requiere `webgl: true`). */
  book: RecipeBook3dPage;
  /** El libro de recetas en su ruta accesible DOM (modo por defecto). */
  catalog: RecipeBookFallbackPage;
  overlay: RecipeOverlayPage;
  form: RecipeFormPage;
  grid: SupplyGridPage;
  priceCapture: PriceCapturePage;
  supplies: SuppliesDialogPage;
  supplyList: SupplyListPage;

  /** Abre `/home` y espera a que el dock esté operable. */
  openHome: () => Promise<HomePage>;
  /** Abre `/home` → estación «Libro de recetas» → libro listo en su ruta DOM. */
  openCatalog: () => Promise<RecipeBookFallbackPage>;
  /** Abre `/home` → estación «Libro de recetas» → libro 3D con la portada asentada. */
  openBook3d: () => Promise<RecipeBook3dPage>;
  /** Abre `/home` → libro (ruta DOM) → botón `Insumos` → diálogo de insumos listo. */
  openSuppliesDialog: () => Promise<SuppliesDialogPage>;
}

export const test = base.extend<AppOptions & AppFixtures>({
  webgl: [false, { option: true }],

  // Antes de cualquier navegación: decide si la página tendrá WebGL.
  pageErrors: [
    async ({ page, webgl }, use) => {
      if (!webgl) {
        await page.addInitScript(DISABLE_WEBGL_SCRIPT);
      }
      const errors: Error[] = [];
      page.on('pageerror', (error) => errors.push(error));
      await use(errors);
      expect(
        errors.map((error) => error.message),
        'la vista no debe lanzar errores no capturados',
      ).toEqual([]);
    },
    { auto: true },
  ],

  /**
   * Falla el test si la app registró un `error`.
   *
   * Es la guarda que de verdad muerde. `pageErrors` escucha `pageerror`, pero
   * `provideBrowserGlobalErrorListeners()` llama a `preventDefault()` sobre los errores que captura,
   * así que todo lo que pasa por Angular **no llega** a ese evento: acaba en el `GlobalErrorHandler`,
   * que lo saca por consola con scope `[uncaught]`. Sin esto, un error tragado no rompería nada.
   *
   * Funciona porque el registro está encendido también en el build de producción que sirven los E2E:
   * `warn` y `error` se ven siempre. **Los `warn` se ignoran a propósito** — son degradaciones
   * esperadas en algunos flujos (un insumo legacy, un fallback), no fallos.
   */
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });
      await use(errors);
      expect(errors, 'la app no debe registrar ningún error en consola').toEqual([]);
    },
    { auto: true },
  ],

  home: async ({ page }, use) => use(new HomePage(page)),
  book: async ({ page }, use) => use(new RecipeBook3dPage(page)),
  catalog: async ({ page }, use) => use(new RecipeBookFallbackPage(page)),
  overlay: async ({ page }, use) => use(new RecipeOverlayPage(page)),
  form: async ({ page }, use) => use(new RecipeFormPage(page)),
  grid: async ({ page }, use) => use(new SupplyGridPage(page)),
  priceCapture: async ({ page }, use) => use(new PriceCapturePage(page)),
  supplies: async ({ page }, use) => use(new SuppliesDialogPage(page)),
  supplyList: async ({ page }, use) => use(new SupplyListPage(page)),

  openHome: async ({ home }, use) => {
    await use(async () => {
      await home.goto();
      return home;
    });
  },

  openCatalog: async ({ home, catalog }, use) => {
    await use(async () => {
      await home.goto();
      await home.station('Libro de recetas').click();
      await catalog.waitReady();
      return catalog;
    });
  },

  openBook3d: async ({ home, book }, use) => {
    await use(async () => {
      await home.goto();
      await home.station('Libro de recetas').click();
      await book.waitReady();
      return book;
    });
  },

  openSuppliesDialog: async ({ home, catalog, supplies }, use) => {
    await use(async () => {
      await home.goto();
      await home.station('Libro de recetas').click();
      await catalog.waitReady();
      await catalog.suppliesButton.click();
      await supplies.waitReady();
      return supplies;
    });
  },
});

export { expect };
