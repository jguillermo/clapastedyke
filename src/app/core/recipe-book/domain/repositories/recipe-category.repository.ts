import { EntityId } from '../../../_common/entity-id';
import { RecipeCategory } from '../entities/recipe-category';

export abstract class RecipeCategoryRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<RecipeCategory | null>;
    abstract byName(name: string): Promise<RecipeCategory | null>;
    abstract save(category: RecipeCategory): Promise<void>;
    abstract all(): Promise<RecipeCategory[]>;
}
