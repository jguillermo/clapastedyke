import { EntityId } from '../../../_common/entity-id';
import { SaveOptions } from './save-options';
import { RecipeFlavor } from '../entities/recipe-flavor';

/**
 * Puerto de acceso a datos del aggregate RecipeFlavor (busca por id, lista, guarda y
 * borra). Inyectado por los use cases del recetario (gestión del catálogo de
 * sabores); implementado en infraestructura por IndexedDbRecipeFlavorRepository sobre
 * IndexedDbStore.
 */
export abstract class RecipeFlavorRepository {
  abstract nextIdentity(): EntityId;
  abstract byId(id: EntityId): Promise<RecipeFlavor | null>;
  abstract all(): Promise<RecipeFlavor[]>;
  abstract save(flavor: RecipeFlavor, options?: SaveOptions): Promise<void>;
  abstract delete(id: EntityId): Promise<void>;
}
