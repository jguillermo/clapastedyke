/**
 * Browser database (IndexedDB) opening and versioning. One object store per
 * aggregate. Versioning only ADDS stores — data is never deleted. The
 * aggregate ⇄ document mapping lives in each repository's mapper, never here.
 */

export const DB_NAME = 'clapastedyke';
export const DB_VERSION = 2;

const STORES = [
    'ingredients',
    'sponge_recipes',
    'filling_recipes',
    'covering_recipes',
    // 'toppers' and 'packaging_items' are legacy: topper/box/base are now
    // Ingredients (told apart by usage). Kept here so existing DBs are untouched.
    'toppers',
    'packaging_items',
    'packaging_rules',
    'cake_compositions',
    'ingredient_price_history',
    'progress',
] as const;

export type StoreName = (typeof STORES)[number];

let connection: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
    connection ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            for (const name of STORES) {
                if (!db.objectStoreNames.contains(name)) {
                    db.createObjectStore(name, { keyPath: 'id' });
                }
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB.'));
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
        request.onerror = () => reject(request.error ?? new Error('IndexedDB operation failed.'));
    });
}
