import { EntityId } from '../../../_common/entity-id';
import { FillingRecipe } from '../entities/filling-recipe';

export abstract class FillingRecipeRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<FillingRecipe | null>;
    abstract byName(name: string): Promise<FillingRecipe | null>;
    abstract save(recipe: FillingRecipe): Promise<void>;
    abstract all(): Promise<FillingRecipe[]>;
}
