import { EntityId } from '../../../_common/entity-id';
import { SpongeRecipe } from '../entities/sponge-recipe';

export abstract class SpongeRecipeRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<SpongeRecipe | null>;
    abstract byName(name: string): Promise<SpongeRecipe | null>;
    abstract save(recipe: SpongeRecipe): Promise<void>;
    abstract all(): Promise<SpongeRecipe[]>;
}
