import { EntityId } from '../../../_common/entity-id';
import { Recipe } from '../../domain/entities/recipe';
import { RecipeRecord } from '../records';
import { lineToDomain, lineToRecord } from '../value-record.mappers';

/**
 * ACL de persistencia: traduce `Recipe` ⇄ `RecipeRecord` (primitivos de IndexedDB).
 * Usado por `IndexedDbRecipeRepository`. Mapea las `SupplyLine` (vía `value-record.mappers`).
 */
export const RecipeMapper = {
    toRecord(recipe: Recipe): RecipeRecord {
        return {
            id: recipe.id.value,
            categoryId: recipe.categoryId.value,
            name: recipe.name,
            lines: recipe.lines.map(lineToRecord),
            flavorId: recipe.flavorId ? recipe.flavorId.value : null,
            portionsCapacityId: recipe.portionsCapacityId ? recipe.portionsCapacityId.value : null,
            moldCapacityId: recipe.moldCapacityId ? recipe.moldCapacityId.value : null,
        };
    },

    toDomain(record: RecipeRecord): Recipe {
        return Recipe.create(
            new EntityId(record.id),
            new EntityId(record.categoryId),
            record.name,
            record.lines.map(lineToDomain),
            record.flavorId ? new EntityId(record.flavorId) : null,
            record.portionsCapacityId ? new EntityId(record.portionsCapacityId) : null,
            record.moldCapacityId ? new EntityId(record.moldCapacityId) : null,
        );
    },
};
