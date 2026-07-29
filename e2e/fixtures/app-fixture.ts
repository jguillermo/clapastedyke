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
});

export { expect };
