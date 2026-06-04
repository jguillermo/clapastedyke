import { StoreName, ask, openDatabase } from './database';

/**
 * Generic CRUD access to one object store. Each aggregate repository uses it
 * to persist FLAT DOCUMENTS (primitives); the aggregate ⇄ document mapping
 * lives in each repository, never here.
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

  async delete(id: string): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(this.name, 'readwrite');
    await ask(tx.objectStore(this.name).delete(id));
  }
}
