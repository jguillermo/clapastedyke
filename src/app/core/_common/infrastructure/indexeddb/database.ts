/**
 * Browser database (IndexedDB) opening and versioning. One object store per
 * aggregate. Versioning only ADDS stores — data is never deleted. The
 * aggregate ⇄ document mapping lives in each repository's mapper, never here.
 */

export const DB_NAME = 'clapastedyke';
export const DB_VERSION = 9;

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
  // Ajustes de autenticación: SOLO configuración de este navegador (el identificador de cliente).
  // Ni credenciales, ni identidad, ni referencias a la hoja del usuario — eso vive en memoria y
  // desaparece al cerrar sesión.
  'auth_settings',
  // Cola durable de cambios pendientes de sincronizar. No guarda un agregado sino TRABAJO POR HACER,
  // y por eso vive aquí: un refresco a media sincronización no puede llevarse por delante los
  // cambios que esperaban turno. Ver `external-sync/infrastructure/indexeddb-sync-outbox.ts`.
  'sync_outbox',
  // 'domain_events' nació y murió en la misma tanda: el bus de eventos acabó con su PROPIA base de
  // datos (`_common/eventbus/event-database.ts`) para no depender del versionado de esta. Se
  // conserva en la lista porque los stores solo se AÑADEN, pero ya no se lee ni se escribe.
  'domain_events',
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

    request.onsuccess = () => resolve(request.result);
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
