import { NombreAlmacen, abrirBaseDatos, pedir } from './base-datos';

/**
 * Acceso CRUD genérico a un object store. Los repositorios de cada agregado
 * lo usan para persistir DOCUMENTOS PLANOS (primitivos); el mapeo
 * agregado ⇄ documento vive en cada repositorio, nunca aquí.
 */
export class AlmacenIndexedDb<Documento extends { id: string }> {
  constructor(private readonly nombre: NombreAlmacen) {}

  async obtener(id: string): Promise<Documento | null> {
    const bd = await abrirBaseDatos();
    const tx = bd.transaction(this.nombre, 'readonly');
    const doc = await pedir<Documento | undefined>(tx.objectStore(this.nombre).get(id));
    return doc ?? null;
  }

  async todos(): Promise<Documento[]> {
    const bd = await abrirBaseDatos();
    const tx = bd.transaction(this.nombre, 'readonly');
    return pedir<Documento[]>(tx.objectStore(this.nombre).getAll());
  }

  /** Inserta o reemplaza (un agregado por transacción). */
  async guardar(documento: Documento): Promise<void> {
    const bd = await abrirBaseDatos();
    const tx = bd.transaction(this.nombre, 'readwrite');
    await pedir(tx.objectStore(this.nombre).put(documento));
  }

  async eliminar(id: string): Promise<void> {
    const bd = await abrirBaseDatos();
    const tx = bd.transaction(this.nombre, 'readwrite');
    await pedir(tx.objectStore(this.nombre).delete(id));
  }
}
