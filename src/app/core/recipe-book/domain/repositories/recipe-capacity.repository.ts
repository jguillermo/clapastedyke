import { EntityId } from '../../../_common/entity-id';
import { SaveOptions } from './save-options';
import { CapacityGroup, RecipeCapacity } from '../entities/recipe-capacity';

/**
 * Puerto de acceso a datos del aggregate RecipeCapacity (busca por id, por grupo,
 * lista, guarda y borra). Inyectado por los use cases del recetario (gestión del
 * catálogo de capacidades); implementado en infraestructura por
 * IndexedDbRecipeCapacityRepository sobre IndexedDbStore.
 */
export abstract class RecipeCapacityRepository {
  abstract nextIdentity(): EntityId;
  abstract byId(id: EntityId): Promise<RecipeCapacity | null>;
  abstract byGroup(group: CapacityGroup): Promise<RecipeCapacity[]>;
  abstract all(): Promise<RecipeCapacity[]>;
  abstract save(capacity: RecipeCapacity, options?: SaveOptions): Promise<void>;
  abstract delete(id: EntityId): Promise<void>;
}
