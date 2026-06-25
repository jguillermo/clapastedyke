import { EntityId } from '../../../_common/entity-id';
import { Recipe } from '../entities/recipe';

export abstract class RecipeRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<Recipe | null>;
    abstract byNameInCategory(categoryId: EntityId, name: string): Promise<Recipe | null>;
    abstract byCategory(categoryId: EntityId): Promise<Recipe[]>;
    abstract save(recipe: Recipe): Promise<void>;
    abstract all(): Promise<Recipe[]>;
}
