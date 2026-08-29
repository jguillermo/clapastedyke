import type { Page } from '@playwright/test';

/**
 * Borra las bases locales del navegador **y rearranca la app**: la deja como la de alguien que la
 * abre por primera vez.
 *
 * Es la forma honesta de simular «otro dispositivo» sin un segundo contexto: lo que distingue a un
 * aparato nuevo es justo no tener nada guardado, y ese es el estado que produce esto.
 *
 * ## Por qué recarga, y por qué no es opcional
 *
 * Vaciar IndexedDB sin rearrancar no simula nada: la app ya tiene en memoria la sesión, el catálogo
 * y el id de la hoja, así que sigue comportándose como el aparato de siempre. La promesa de esta
 * función solo es cierta después del arranque en frío, así que lo hace ella.
 *
 * Antes salía gratis y por accidente: quien la llamaba navegaba después con `page.goto('/cuenta')`,
 * que era una carga de documento completa. Con la app enrutando por fragmento (`withHashLocation`),
 * `goto('/#/cuenta')` estando ya en `/#/cuenta` es navegación **del mismo documento** y no rearranca
 * nada — el test seguía con el estado anterior y fallaba mucho más tarde, sin decir por qué.
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

  // El arranque en frío que hace cierto todo lo anterior.
  await page.reload();
}
