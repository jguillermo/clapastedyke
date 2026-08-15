import { test as base, expect, type Page } from '@playwright/test';
import { DISABLE_WEBGL_SCRIPT } from '../support/webgl';
import { GoogleDouble } from '../support/google-double';
import { AccountPage } from '../pages/account.page';
import { SyncBadgePage } from '../pages/sync-badge.page';
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
/**
 * **Un segundo aparato**: otro navegador, con su propia base de datos, contra la MISMA hoja.
 *
 * Es la única forma de probar de verdad que sincronizar sirve para algo. Todo lo demás se puede fingir
 * desde un solo navegador —editar la hoja a mano imita al otro aparato—, pero hay dos cosas que no:
 * que cada aparato tiene **su propia identidad** y **su propio catálogo sembrado**, y es justo del
 * cruce de esas dos de donde salió la pérdida de datos que motivó este fixture.
 *
 * El contexto es nuevo, así que su IndexedDB está vacía y la app arranca como en un móvil recién
 * estrenado: siembra, conecta, y se encuentra una hoja que ya tiene el trabajo del otro.
 */
export interface SecondDevice {
  readonly page: Page;
  readonly account: AccountPage;
  readonly home: HomePage;
  readonly catalog: RecipeBookFallbackPage;
  readonly supplies: SuppliesDialogPage;
  readonly supplyList: SupplyListPage;
  readonly form: RecipeFormPage;
  readonly grid: SupplyGridPage;
}

export interface AppFixtures {
  /** Otro navegador, con su propia base local, contra la misma hoja. Ver {@link SecondDevice}. */
  secondDevice: SecondDevice;

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
  account: AccountPage;
  /** El aviso de sincronización que el armazón monta sobre cualquier vista. */
  syncBadge: SyncBadgePage;

  /**
   * El doble de Google (Identity Services + Sheets + Drive) enganchado a la página.
   *
   * **Solo lo tienen los tests que lo piden**: el resto de la suite carga el `config.json` de verdad,
   * que trae el `googleClientId` vacío, así que la integración está apagada y no se toca nada de red.
   *
   * Pedirlo instala las rutas **antes de cualquier navegación** (Playwright resuelve los fixtures del
   * test antes del cuerpo), y su estado es la hoja del usuario: se lee y se edita desde el test como lo
   * haría una persona. Ver `support/google-double.ts`.
   */
  google: GoogleDouble;

  /** Abre `/home` y espera a que el dock esté operable. */
  openHome: () => Promise<HomePage>;
  /** Abre `/home` → estación «Libro de recetas» → libro listo en su ruta DOM. */
  openCatalog: () => Promise<RecipeBookFallbackPage>;
  /** Abre `/home` → estación «Libro de recetas» → libro 3D con la portada asentada. */
  openBook3d: () => Promise<RecipeBook3dPage>;
  /** Abre `/home` → libro (ruta DOM) → botón `Insumos` → diálogo de insumos listo. */
  openSuppliesDialog: () => Promise<SuppliesDialogPage>;

  /**
   * Abre `/cuenta`, conecta la cuenta contra el doble y espera a que la hoja esté creada y el
   * recetario subido. A partir de ahí `google.sheet` es la hoja del usuario.
   */
  connectAccount: () => Promise<AccountPage>;
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
  account: async ({ page }, use) => use(new AccountPage(page)),
  syncBadge: async ({ page }, use) => use(new SyncBadgePage(page)),

  google: async ({ page }, use) => {
    const google = new GoogleDouble();
    await google.install(page);
    await use(google);
    // Que no quede una petición retenida cuando el test acaba: la página se está cerrando y una
    // promesa colgada aquí retrasaría el cierre del contexto.
    google.resume();
  },

  secondDevice: async ({ browser, contextOptions, google, webgl }, use) => {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    if (!webgl) {
      await page.addInitScript(DISABLE_WEBGL_SCRIPT);
    }
    // El MISMO doble: los dos aparatos hablan con el mismo Google, que es lo que se está probando.
    await google.install(page);

    // La misma guarda que el aparato principal: un error en consola de este también rompe el test.
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await use({
      page,
      account: new AccountPage(page),
      home: new HomePage(page),
      catalog: new RecipeBookFallbackPage(page),
      supplies: new SuppliesDialogPage(page),
      supplyList: new SupplyListPage(page),
      form: new RecipeFormPage(page),
      grid: new SupplyGridPage(page),
    });

    await context.close();
    expect(errors, 'el segundo aparato no debe registrar ningún error en consola').toEqual([]);
  },

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

  // Depende de `google`, así que pedirlo garantiza que el doble esté enganchado antes de navegar.
  connectAccount: async ({ google, account }, use) => {
    await use(async () => {
      await account.goto();
      await account.connectAndWait();
      // La hoja tiene que existir a partir de aquí. Se comprueba en el atajo para que un fallo del
      // doble se lea como «no se creó la hoja» y no como un `expect` raro a mitad del journey.
      expect(google.sheet.titles.length, 'conectar debe haber creado la hoja').toBeGreaterThan(0);
      return account;
    });
  },
});

export { expect };
