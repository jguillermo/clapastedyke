import { EntityId } from '../../../_common/entity-id';
import { CoveringRecipe } from '../entities/covering-recipe';

export abstract class CoveringRecipeRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<CoveringRecipe | null>;
    abstract byName(name: string): Promise<CoveringRecipe | null>;
    abstract save(recipe: CoveringRecipe): Promise<void>;
    abstract all(): Promise<CoveringRecipe[]>;
}
