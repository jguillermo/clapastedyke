import { EntityId } from '../../../_common/entity-id';
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
    abstract save(category: RecipeCategory): Promise<void>;
    abstract all(): Promise<RecipeCategory[]>;
}
