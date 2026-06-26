import { EntityId } from '../../../_common/entity-id';
import { RecipeSelection } from '../entities/recipe-selection';

export abstract class RecipeSelectionRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<RecipeSelection | null>;
    abstract byRecipe(recipeId: EntityId): Promise<RecipeSelection[]>;
    abstract all(): Promise<RecipeSelection[]>;
    abstract save(selection: RecipeSelection): Promise<void>;
}
