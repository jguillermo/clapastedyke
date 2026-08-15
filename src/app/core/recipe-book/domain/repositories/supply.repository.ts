import { EntityId } from '../../../_common/entity-id';
import { SaveOptions } from './save-options';
import { Supply } from '../entities/supply';

/**
 * Puerto de acceso a datos del aggregate Supply (busca por id/nombre, guarda,
 * lista y borra). Inyectado por los use cases del recetario (alta/edición de insumos);
 * implementado en infraestructura por IndexedDbSupplyRepository sobre
 * IndexedDbStore.
 */
export abstract class SupplyRepository {
  abstract nextIdentity(): EntityId;
  abstract byId(id: EntityId): Promise<Supply | null>;
  abstract byName(name: string): Promise<Supply | null>;
  abstract save(supply: Supply, options?: SaveOptions): Promise<void>;
  abstract all(): Promise<Supply[]>;
  /**
   * Borra el insumo.
   *
   * El **cómo** es cosa de la implementación, y la de IndexedDB lo hace con una lápida: un borrado
   * tiene que poder viajar a los demás dispositivos, y una fila que simplemente desaparece la resube
   * el primero que estuviera desconectado. Desde aquí, borrado es borrado — no se vuelve a leer.
   */
  abstract delete(id: EntityId): Promise<void>;
}
