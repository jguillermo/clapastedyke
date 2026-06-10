import { EntityId } from '../../_common/entity-id';
import { FillingRecipe } from '../domain/entities/filling-recipe';
import { FillingRecipeRecord } from './records';
import { lineToDomain, lineToRecord, quantityToDomain, quantityToRecord } from './value-record.mappers';

export const FillingRecipeMapper = {
    toRecord(recipe: FillingRecipe): FillingRecipeRecord {
        return {
            id: recipe.id.value,
            name: recipe.name,
            referenceWeight: quantityToRecord(recipe.referenceWeight),
            lines: recipe.lines.map(lineToRecord),
        };
    },

    toDomain(record: FillingRecipeRecord): FillingRecipe {
        return FillingRecipe.create(
            new EntityId(record.id),
            record.name,
            quantityToDomain(record.referenceWeight),
            record.lines.map(lineToDomain),
        );
    },
};
