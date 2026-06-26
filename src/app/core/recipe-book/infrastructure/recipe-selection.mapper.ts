import { EntityId } from '../../_common/entity-id';
import { RecipeSelection } from '../domain/entities/recipe-selection';
import { RecipeSelectionRecord } from './records';

export const RecipeSelectionMapper = {
    toRecord(selection: RecipeSelection): RecipeSelectionRecord {
        return {
            id: selection.id.value,
            recipeId: selection.recipeId.value,
            flavorLabel: selection.flavorLabel,
            portionsOptionId: selection.portionsOptionId?.value,
            moldOptionId: selection.moldOptionId?.value,
        };
    },

    toDomain(record: RecipeSelectionRecord): RecipeSelection {
        return RecipeSelection.create(new EntityId(record.id), new EntityId(record.recipeId), {
            flavorLabel: record.flavorLabel,
            portionsOptionId: record.portionsOptionId ? new EntityId(record.portionsOptionId) : undefined,
            moldOptionId: record.moldOptionId ? new EntityId(record.moldOptionId) : undefined,
        });
    },
};
