import { EntityId } from '../../../_common/entity-id';
import { Ingredient } from '../entities/ingredient';

export abstract class IngredientRepository {
    abstract nextIdentity(): EntityId;
    abstract byId(id: EntityId): Promise<Ingredient | null>;
    abstract byName(name: string): Promise<Ingredient | null>;
    abstract save(ingredient: Ingredient): Promise<void>;
    abstract all(): Promise<Ingredient[]>;
}
