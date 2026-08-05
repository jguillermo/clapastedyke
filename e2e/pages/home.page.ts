import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object de `features/game/home` (`app-home`, ruta `/home`).
 *
 * La vista es el mundo 3D de la cocina más un HUD DOM: cabecera de nivel, globo del
 * chef y el **dock de estaciones**, que es la ruta accesible siempre operable. Sin
 * WebGL desaparece el canvas y se muestra el bloque «Tu cocina», pero el dock sigue
 * siendo el punto de entrada al libro de recetas.
 */
export class HomePage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-home');

  /** Lienzo del mundo 3D (solo existe cuando hay WebGL). */
  readonly canvas = this.root.locator('canvas');

  /** Cabecera del HUD: insignia de nivel + título del nivel. */
  readonly hud = this.root.locator('header');
  readonly levelBadge = this.hud.getByText('Nivel 0', { exact: true });
  readonly levelTitle = this.hud.getByText('El libro de recetas en blanco');

  /**
   * Globo del chef coach (aparece al terminar el `flyIn`). Se distingue de la región
   * `aria-live` del libro — que también vive bajo `app-home` cuando está abierto —
   * porque el globo es un `role="status"` sin `aria-live` propio.
   */
  readonly coach = this.root.locator('p[role="status"]:not([aria-live])');

  /** Acceso a `/cuenta` desde el HUD. En móvil solo se ve el icono; el nombre lo da `aria-label`. */
  readonly accountLink = this.root.getByRole('link', { name: 'Cuenta', exact: true });

  /** Dock de estaciones: la ruta accesible. */
  readonly dock = this.root.locator('nav[aria-label="Estaciones de la cocina"]');
  readonly stations = this.dock.getByRole('button');

  /** Bloque de fallback cuando el equipo no soporta WebGL. */
  readonly noWebglHeading = this.root.getByRole('heading', { name: 'Tu cocina' });
  readonly noWebglHint = this.root.getByText('Tu equipo no puede mostrar la cocina en 3D');

  station(label: 'Libro de recetas' | 'Despensa' | 'Horno'): Locator {
    return this.dock.getByRole('button', { name: new RegExp(`^${label}`) });
  }

  /**
   * Contenido del `<meta name="viewport">` del documento. La app bloquea el zoom a
   * propósito (`user-scalable=no`), la única excepción aceptada a las reglas de AXE.
   * Es un meta del `<head>`: no tiene rol ni nombre accesible, así que se localiza por
   * el elemento nativo y su atributo.
   */
  async viewportContent(): Promise<string | null> {
    return this.page.locator('meta[name="viewport"]').getAttribute('content');
  }

  /** Navega a la app y espera a que el HUD esté operable (el seed ya corrió). */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForURL('**/home');
    await expect(this.dock).toBeVisible();
  }
}
