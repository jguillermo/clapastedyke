import { EntityId } from '../../../_common/entity-id';
import { SaveOptions } from './save-options';
import { RecipeCategory } from '../entities/recipe-category';

/**
 * Puerto de acceso a datos del aggregate RecipeCategory (busca por id/nombre,
 * guarda y lista). Inyectado por los use cases del recetario (siembra de
 * categorías de sistema, edición de esquemas); implementado en infraestructura
 * por IndexedDbRecipeCategoryRepository sobre IndexedDbStore.
 */
export abstract class RecipeCategoryRepository {
  abstract nextIdentity(): EntityId;
  abstract byId(id: EntityId): Promise<RecipeCategory | null>;
  abstract byName(name: string): Promise<RecipeCategory | null>;
  abstract save(category: RecipeCategory, options?: SaveOptions): Promise<void>;
  abstract all(): Promise<RecipeCategory[]>;
  /** Borra la categoría. El **cómo** es cosa de la implementación — ver `SupplyRepository.delete`. */
  abstract delete(id: EntityId): Promise<void>;
}
