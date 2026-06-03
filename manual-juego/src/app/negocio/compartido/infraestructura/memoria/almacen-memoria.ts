import { GeneradorIds, IdEntidad, PrefijoId } from '../../dominio/id-entidad';

/**
 * Dobles en memoria para tests de casos de uso (repositorios in-memory),
 * con la misma forma que los adaptadores IndexedDB.
 */
export class AlmacenEnMemoria<Documento extends { id: string }> {
  private readonly filas = new Map<string, Documento>();

  async obtener(id: string): Promise<Documento | null> {
    return this.filas.get(id) ?? null;
  }

  async todos(): Promise<Documento[]> {
    return [...this.filas.values()];
  }

  async guardar(documento: Documento): Promise<void> {
    this.filas.set(documento.id, structuredClone(documento));
  }

  async eliminar(id: string): Promise<void> {
    this.filas.delete(id);
  }
}

export class GeneradorIdsEnMemoria implements GeneradorIds {
  private readonly contadores = new Map<string, number>();

  async siguiente(prefijo: PrefijoId): Promise<IdEntidad> {
    const siguiente = (this.contadores.get(prefijo) ?? 0) + 1;
    this.contadores.set(prefijo, siguiente);
    return IdEntidad.crear(prefijo, siguiente);
  }
}
