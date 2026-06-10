import { EntityId } from '../../_common/entity-id';
import { CoveringRecipe } from '../domain/entities/covering-recipe';
import { CoveringRecipeRecord } from './records';
import { lineToDomain, lineToRecord, quantityToDomain, quantityToRecord } from './value-record.mappers';

export const CoveringRecipeMapper = {
    toRecord(recipe: CoveringRecipe): CoveringRecipeRecord {
        return {
            id: recipe.id.value,
            name: recipe.name,
            referenceWeight: quantityToRecord(recipe.referenceWeight),
            lines: recipe.lines.map(lineToRecord),
        };
    },

    toDomain(record: CoveringRecipeRecord): CoveringRecipe {
        return CoveringRecipe.create(
            new EntityId(record.id),
            record.name,
            quantityToDomain(record.referenceWeight),
            record.lines.map(lineToDomain),
        );
    },
};
