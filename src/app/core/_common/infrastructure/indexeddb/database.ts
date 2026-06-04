/**
 * Browser database (IndexedDB) opening and versioning.
 * One object store per aggregate + 'counters' for the id sequences.
 * Versioning only ADDS stores — data is never deleted.
 *
 * Replaces the legacy Spanish database 'negocio-costeo' (test data discarded
 * by decision: the English refactor starts on a clean store).
 */

export const DB_NAME = 'bakery-costing';
export const DB_VERSION = 3;

const STORES = [
  'customers',
  'suppliers',
  'supplies',
  'recipes',
  'packaging_rules',
  'settings',
  'quotes',
  'orders',
  'sales',
  'purchases',
  'stock_movements',
  'progress', // v2: progresión del juego (singleton 'PROGRESS')
  'productions', // v2: registro de lo cocinado (kitchen)
  'popularity', // v3: reputation (singleton 'POPULARITY')
  'social_posts', // v3: publicaciones en redes
  'informal_orders', // v3: pedidos informales
] as const;

export type StoreName = (typeof STORES)[number] | 'counters';

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
      if (!db.objectStoreNames.contains('counters')) {
        db.createObjectStore('counters', { keyPath: 'prefix' });
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
