import { ask, openDatabase, StoreName } from './database';

/**
 * Generic CRUD access to one object store. Each aggregate repository uses it to
 * persist FLAT DOCUMENTS (primitives); the aggregate ⇄ document mapping lives
 * in each repository's mapper, never here.
 */
export class IndexedDbStore<Document extends { id: string }> {
  constructor(private readonly name: StoreName) {}

  async get(id: string): Promise<Document | null> {
    const db = await openDatabase();
    const tx = db.transaction(this.name, 'readonly');
    const doc = await ask<Document | undefined>(tx.objectStore(this.name).get(id));
    return doc ?? null;
  }

  async all(): Promise<Document[]> {
    const db = await openDatabase();
    const tx = db.transaction(this.name, 'readonly');
    return ask<Document[]>(tx.objectStore(this.name).getAll());
  }

  /** Inserts or replaces (one aggregate per transaction). */
  async put(document: Document): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(this.name, 'readwrite');
    await ask(tx.objectStore(this.name).put(document));
  }

  /**
   * Inserta o reemplaza **N documentos en UNA sola transacción**.
   *
   * No es azúcar sobre `put`: abrir una transacción por documento es el coste dominante de traerse una
   * tabla entera de fuera —bajar trescientas filas son trescientas transacciones—, y además deja de
   * ser atómico: una caída a la mitad guarda unas filas sí y otras no. Aquí, o entran todas o no entra
   * ninguna.
   *
   * Con la lista vacía no abre transacción: pedirle a IndexedDB una transacción para nada es una
   * espera y un fallo posible a cambio de cero trabajo.
   */
  async putAll(documents: readonly Document[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }
    const db = await openDatabase();
    const tx = db.transaction(this.name, 'readwrite');
    const store = tx.objectStore(this.name);
    // Se encolan todas las peticiones sobre la MISMA transacción y se esperan juntas: un `await` por
    // documento dejaría morir la transacción entre uno y otro (IndexedDB la cierra en cuanto el turno
    // de eventos queda sin peticiones vivas).
    await Promise.all(documents.map((document) => ask(store.put(document))));
  }

  async delete(id: string): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(this.name, 'readwrite');
    await ask(tx.objectStore(this.name).delete(id));
  }
}
