import { expect, type Page } from '@playwright/test';

/**
 * Page object de `features/sync-badge` (`app-sync-badge`): el aviso discreto que el armazón monta
 * sobre cualquier vista, incluidos el mundo 3D y los diálogos.
 *
 * **Cuando todo está al día, no existe en el DOM.** Eso es lo que se comprueba con
 * {@link waitInvisible}: no que esté oculto por CSS, sino que no hay nada — aparecer *es* la señal.
 *
 * El mensaje viaja en el nombre accesible del botón («1 sin subir. Abrir el estado de la
 * sincronización.»), así que se asserta por ahí y no por el texto pintado.
 */
export class SyncBadgePage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-sync-badge');
  /** El aviso en sí. No existe mientras no haya nada que contar. */
  readonly button = this.root.getByRole('button');

  /** Espera a que el aviso desaparezca del todo (la sincronización se puso al día). */
  async waitInvisible(timeout = 30_000): Promise<void> {
    await expect(this.button).toHaveCount(0, { timeout });
  }

  /** Espera a que el aviso esté a la vista con el mensaje esperado. */
  async waitFor(message: RegExp, timeout = 15_000): Promise<void> {
    await expect(this.button).toHaveAccessibleName(message, { timeout });
  }
}
