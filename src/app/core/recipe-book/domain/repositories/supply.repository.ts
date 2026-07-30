import { EntityId } from '../../../_common/entity-id';
import { Supply } from '../entities/supply';

/**
 * Puerto de acceso a datos del aggregate Supply (busca por id/nombre, guarda y
 * lista). Inyectado por los use cases del recetario (alta/edición de insumos);
 * implementado en infraestructura por IndexedDbSupplyRepository sobre
 * IndexedDbStore.
 */
export abstract class SupplyRepository {
  abstract nextIdentity(): EntityId;
  abstract byId(id: EntityId): Promise<Supply | null>;
  abstract byName(name: string): Promise<Supply | null>;
  abstract save(supply: Supply): Promise<void>;
  abstract all(): Promise<Supply[]>;
}
