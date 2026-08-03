import { defineConfig, devices } from '@playwright/test';
import type { AppOptions } from './fixtures/app-fixture';

/**
 * Configuración de Playwright para los E2E de `src/app/features`.
 *
 * Todo lo relativo a E2E vive bajo `e2e/`: esta config, los page objects
 * (`pages/`), los fixtures (`fixtures/`), los helpers (`support/`) y los specs
 * (`specs/`, una carpeta por ruta/vista y un fichero por tipo de test).
 *
 * ### Velocidad
 * - **Pocos tests, largos.** Cada test es un *journey completo* que encadena varios casos en
 *   una sola sesión. Lo caro de un E2E aquí no es la interacción: es el **arranque** (contexto
 *   de navegador nuevo + bootstrap de Angular + seed en IndexedDB + navegar a la vista), y eso
 *   se paga **una vez por test**, no una vez por aserción. Partir un flujo en tests pequeños
 *   multiplica arranques sin añadir cobertura — ver `e2e-tests-conventions.md`.
 * - `fullyParallel` + workers al 75 % de la CPU.
 * - **Por defecto los tests corren SIN WebGL** (`webgl: false`): la vista cae a su
 *   ruta accesible en DOM, que es determinista y arranca en milisegundos. Los specs
 *   que sí prueban el mundo/libro 3D declaran `test.use({ webgl: true })` y quedan
 *   agrupados en sus propias carpetas (`book-3d/`, `recipe-overlay/`).
 * - Aislamiento gratis: Playwright da un contexto de navegador nuevo por test, así
 *   que cada uno arranca con IndexedDB vacía y el seed del libro recién aplicado.
 *   No hace falta limpiar nada entre tests.
 * - Sin esperas fijas: los page objects usan aserciones web-first (auto-retry).
 *
 * ### Proyectos
 * - `desktop` → 1280×800, ignora `*.mobile.spec.ts`.
 * - `mobile`  → 375×667 con táctil (la regla dura mobile-first se verifica a 375px);
 *   solo corre los `*.mobile.spec.ts`, para no duplicar la suite entera.
 */

const PORT = Number(process.env['E2E_PORT'] ?? 4200);
const BASE_URL = process.env['E2E_BASE_URL'] ?? `http://localhost:${PORT}`;
const CI = !!process.env['CI'];

export default defineConfig<AppOptions>({
  testDir: './specs',
  outputDir: '../test-results/e2e',

  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : '75%',

  // Los tests son journeys completos (muchos pasos por test), no comprobaciones sueltas: el
  // presupuesto por test es alto a propósito. Lo que NO se relaja es `expect`, que es lo que
  // detecta de verdad que algo se colgó.
  timeout: 180_000,
  expect: { timeout: 10_000 },

  reporter: CI
    ? [['github'], ['html', { outputFolder: '../playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: '../playwright-report', open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Opción propia: `false` = se anula WebGL y la vista usa su ruta accesible DOM.
    webgl: false,
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testIgnore: '**/*.mobile.spec.ts',
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
        hasTouch: true,
      },
      testMatch: '**/*.mobile.spec.ts',
    },
  ],

  /**
   * Se sirve el **build compilado** (`dist/misaevol/browser`) con un servidor estático
   * sin dependencias, no `ng serve`: los tests no necesitan dev server ni watch, y el
   * bundle ya construido carga como en producción (más rápido y determinista).
   * `npm run test:e2e` hace el `ng build` antes de arrancar Playwright.
   */
  webServer: {
    command: `node e2e/support/static-server.mjs --port ${PORT}`,
    cwd: '..',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
