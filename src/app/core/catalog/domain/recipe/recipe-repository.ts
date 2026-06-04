import { EntityId } from '../../../_common/domain/entity-id';
import { Recipe } from './recipe';

export interface RecipeRepository {
  nextId(): Promise<EntityId>;
  byId(id: EntityId): Promise<Recipe | null>;
  byName(name: string): Promise<Recipe | null>;
  save(recipe: Recipe): Promise<void>;
  all(): Promise<Recipe[]>;
}
