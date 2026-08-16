import type { Page } from '@playwright/test';

/**
 * Borra las bases locales del navegador: lo deja como el de alguien que abre la app por primera vez.
 *
 * Es la forma honesta de simular «otro dispositivo» sin un segundo contexto: lo que distingue a un
 * aparato nuevo es justo no tener nada guardado, y ese es el estado que produce esto.
 */
export async function clearLocalDatabases(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (const { name } of await indexedDB.databases()) {
      if (!name) {
        continue;
      }
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(name);
        // Da igual cómo acabe: si algo quedara, la recarga siguiente lo dejaría ver.
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });
    }
  });
}
