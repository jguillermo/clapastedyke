import { EntityId } from '../../../_common/entity-id';
import { Recipe } from '../entities/recipe';

/**
 * Puerto de acceso a datos del aggregate Recipe (busca por id, por nombre dentro
 * de una categoría o por categoría, guarda y lista). Inyectado por los use cases
 * del recetario (alta/edición de recetas, composición del pastel); implementado
 * en infraestructura por IndexedDbRecipeRepository sobre IndexedDbStore.
 */
export abstract class RecipeRepository {
  abstract nextIdentity(): EntityId;
  abstract byId(id: EntityId): Promise<Recipe | null>;
  abstract byNameInCategory(categoryId: EntityId, name: string): Promise<Recipe | null>;
  abstract byCategory(categoryId: EntityId): Promise<Recipe[]>;
  abstract save(recipe: Recipe): Promise<void>;
  abstract all(): Promise<Recipe[]>;
}
