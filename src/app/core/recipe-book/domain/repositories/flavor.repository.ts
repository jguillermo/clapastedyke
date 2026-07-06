import { EntityId } from '../../../_common/entity-id';
import { Flavor } from '../entities/flavor';

/**
 * Puerto de acceso a datos del aggregate Flavor (busca por id, lista, guarda y
 * borra). Inyectado por los use cases del recetario (gestión del catálogo de
 * sabores); implementado en infraestructura por IndexedDbFlavorRepository sobre
 * IndexedDbStore.
 */
export abstract class FlavorRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<Flavor | null>;
    abstract all(): Promise<Flavor[]>;
    abstract save(flavor: Flavor): Promise<void>;
    abstract delete(id: EntityId): Promise<void>;
}
