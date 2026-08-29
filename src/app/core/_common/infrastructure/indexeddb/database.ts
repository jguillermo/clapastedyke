/**
 * Browser database (IndexedDB) opening and versioning. One object store per
 * aggregate. Versioning only ADDS stores — data is never deleted. The
 * aggregate ⇄ document mapping lives in each repository's mapper, never here.
 */

export const DB_NAME = 'clapastedyke';
export const DB_VERSION = 13;

const STORES = [
  'ingredients',
  // Recetario por categorías: una receta genérica + su categoría.
  'recipes',
  'recipe_categories',
  // Catálogos de sabores y opciones de conversión (porciones/molde).
  'flavors',
  'conversion_options',
  // 'recipe_selections' es legacy: la "selección por tamaño" se retiró; el store se conserva
  // (los stores solo se AÑADEN, nunca se quitan) aunque ya no tenga repositorio.
  'recipe_selections',
  // 'sponge_recipes'/'filling_recipes'/'covering_recipes' son legacy (el recetario
  // se unificó en 'recipes'); 'toppers'/'packaging_items' también. Se conservan en
  // la lista para no romper DBs existentes, pero ya no se leen.
  'sponge_recipes',
  'filling_recipes',
  'covering_recipes',
  'toppers',
  'packaging_items',
  'packaging_rules',
  'cake_compositions',
  'ingredient_price_history',
  'progress',
  // Marcador de seeds aplicados (para ejecutar la siembra una sola vez). Ver SeedState.
  'seed_state',
  // 'google_integration' nació y murió dentro de la misma tanda que 'auth_settings' (se renombró al
  // hacer genérico el contexto de autenticación). Se conserva porque los stores solo se AÑADEN.
  'google_integration',
  // 'auth_settings' es legacy: guardaba el identificador de cliente de ESTE navegador, hasta que se
  // vio que identifica a la aplicación y no al usuario, y pasó a salir de `public/config.json`. Se
  // conserva en la lista porque los stores solo se AÑADEN, pero ya no se lee ni se escribe.
  'auth_settings',
  // Con qué cuenta se estaba, para poder reanudar la sesión al recargar sin volver a preguntar. NO
  // guarda la credencial —eso sigue viviendo solo en memoria—, solo el id y el correo con los que
  // pedirle al proveedor un token nuevo en silencio. Ver `auth/domain/repositories/session-hint`.
  'auth_session_hint',
  // Cola durable de cambios pendientes de sincronizar. No guarda un agregado sino TRABAJO POR HACER,
  // y por eso vive aquí: un refresco a media sincronización no puede llevarse por delante los
  // cambios que esperaban turno. Ver `external-sync/infrastructure/indexeddb-sync-outbox.ts`.
  'sync_outbox',
  // 'sync_installations' nació y murió dentro de la misma tanda: guardaba el Apps Script que se
  // instalaba en cada cuenta, hasta que se vio que la app puede escribir la hoja ella misma con la
  // API de Sheets. Se conserva porque los stores solo se AÑADEN, pero ya no se lee ni se escribe.
  'sync_installations',
  // Dónde tiene su hoja cada cuenta. Una entrada por persona: sin esto, cada recarga crearía una
  // hoja nueva en su Drive. No guarda credenciales — esas viven en memoria y mueren con la sesión.
  'sync_targets',
  // 'domain_events' nació y murió en la misma tanda: el bus de eventos acabó con su PROPIA base de
  // datos (`_common/eventbus/event-database.ts`) para no depender del versionado de esta. Se
  // conserva en la lista porque los stores solo se AÑADEN, pero ya no se lee ni se escribe.
  'domain_events',
  // La última fila que se vio en la hoja, por tabla e id: la BASE con la que se compara. Sin ella no
  // se puede distinguir «esta fila la borró alguien en la hoja» de «esta fila nunca llegó a este
  // dispositivo», que son cosas opuestas. Ver `external-sync/infrastructure/indexeddb-sync-shadow.ts`.
  'sync_shadow',
  // Quién es ESTE navegador. Solo un identificador aleatorio, que entra en la versión de cada fila que
  // se escribe para desempatar conflictos de forma igual en todas las máquinas. No identifica a la
  // persona: se regenera al borrar los datos del sitio y no sale de aquí salvo dentro de esa versión.
  'sync_device',
] as const;

export type StoreName = (typeof STORES)[number];

/**
 * Índices por store. Un store que no aparezca aquí no lleva ninguno: los agregados se leen por
 * clave y no necesitan más.
 *
 * La cola de sincronización es la excepción — hay que leerla EN ORDEN DE LLEGADA, y ese orden no es
 * el de su clave (que es la de deduplicación), así que necesita su propio índice.
 */
const INDEXES: Partial<Record<StoreName, readonly string[]>> = {
  sync_outbox: ['seq'],
};

let connection: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  connection ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      // La transacción de la propia subida de versión: es la única forma de alcanzar un store que
      // ya existía para añadirle un índice nuevo.
      const upgrade = request.transaction;
      for (const name of STORES) {
        const store = db.objectStoreNames.contains(name)
          ? upgrade?.objectStore(name)
          : db.createObjectStore(name, { keyPath: 'id' });
        for (const index of INDEXES[name] ?? []) {
          if (store && !store.indexNames.contains(index)) {
            store.createIndex(index, index);
          }
        }
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Una pestaña con la app abierta impide que OTRA suba la versión: mientras esta mantenga la
      // conexión, la de al lado se queda esperando para siempre (ver `onblocked`). Al cerrarla en
      // cuanto alguien quiere subir de versión, la que llega puede seguir. Esta pestaña se queda con
      // una conexión cerrada y sus operaciones fallarán — es lo correcto: su código es el viejo, y lo
      // que toca es recargar, no seguir escribiendo con un esquema que ya no es el vigente.
      db.onversionchange = () => db.close();
      resolve(db);
    };

    // Solo salta si otra pestaña sigue con una versión anterior y no soltó su conexión. Sin este
    // manejador la promesa no se resolvía ni se rechazaba nunca: la app se quedaba en blanco al
    // arrancar, sin error y sin nada que mirar.
    request.onblocked = () =>
      reject(
        new Error(
          `No se pudo subir IndexedDB "${DB_NAME}" a la v${DB_VERSION}: hay otra pestaña de la app abierta con una versión anterior. Ciérrala y recarga.`,
        ),
      );

    // El `DOMException` de IndexedDB no trae pila útil, así que va como `cause` de un error creado
    // aquí. Esta capa NO registra: traduce y relanza, y quien decide qué ve el usuario lo registra
    // una sola vez con la cadena entera. Ver logging-conventions.md → «un dueño por fallo».
    request.onerror = () =>
      reject(
        new Error(`No se pudo abrir IndexedDB "${DB_NAME}" v${DB_VERSION}`, {
          cause: request.error,
        }),
      );
  });
  return connection;
}

/**
 * Vacía **todos** los stores, en una sola transacción. La base sigue existiendo con su esquema y su
 * versión: lo que desaparece es el contenido.
 *
 * Se vacía y **no se borra la base** a propósito. `deleteDatabase()` se queda bloqueado mientras
 * haya una conexión abierta —y la hay, la de esta misma pestaña—, así que dejaría el cierre de
 * sesión esperando a algo que no va a pasar; además invalidaría la conexión cacheada y todo lo que
 * escribiera después reventaría. Vaciar es instantáneo, atómico y deja la app operativa.
 *
 * Aquí NO se registra: se traduce y se relanza, y quien decide el resultado visible lo registra una
 * sola vez con la cadena entera. Ver logging-conventions.md → «un dueño por fallo».
 */
export async function clearAllStores(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction([...STORES], 'readwrite');
  // Todas las peticiones sobre la MISMA transacción y esperadas juntas: un `await` por store la
  // dejaría morir entre uno y otro (IndexedDB la cierra cuando se queda sin peticiones vivas).
  await Promise.all(STORES.map((name) => ask(tx.objectStore(name).clear())));
}

/** Tests only: forget the cached connection. */
export function resetConnectionForTests(): void {
  connection = null;
}

/** Promisifies an IDBRequest. */
export function ask<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(`Falló una operación de IndexedDB sobre "${sourceName(request)}"`, {
          cause: request.error,
        }),
      );
  });
}

/** Sobre qué store iba la petición, para que el error diga algo sin tener que adivinarlo. */
function sourceName(request: IDBRequest): string {
  const source: unknown = request.source;
  if (source instanceof IDBObjectStore) {
    return source.name;
  }
  if (source instanceof IDBIndex) {
    return `${source.objectStore.name}.${source.name}`;
  }
  return 'desconocido';
}
