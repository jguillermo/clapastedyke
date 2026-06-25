import { EntityId } from '../../_common/entity-id';
import { Quantity } from '../../_common/quantity';
import { Recipe } from '../domain/entities/recipe';
import { RecipePropertyValue } from '../domain/value-objects/recipe-property-value';
import { RecipePropertyValueRecord, RecipeRecord, QuantityRecord } from './records';
import { lineToDomain, lineToRecord, quantityToDomain, quantityToRecord } from './value-record.mappers';

const valueToRecord = (v: RecipePropertyValue): RecipePropertyValueRecord => ({
    propertyId: v.propertyId,
    type: v.type,
    value: v.value instanceof Quantity ? quantityToRecord(v.value) : v.value,
});

const valueToDomain = (r: RecipePropertyValueRecord): RecipePropertyValue =>
    RecipePropertyValue.of(
        r.propertyId,
        r.type,
        r.type === 'weight' ? quantityToDomain(r.value as QuantityRecord) : (r.value as string | number),
    );

export const RecipeMapper = {
    toRecord(recipe: Recipe): RecipeRecord {
        return {
            id: recipe.id.value,
            categoryId: recipe.categoryId.value,
            name: recipe.name,
            values: recipe.values.map(valueToRecord),
            lines: recipe.lines.map(lineToRecord),
        };
    },

    toDomain(record: RecipeRecord): Recipe {
        return Recipe.create(
            new EntityId(record.id),
            new EntityId(record.categoryId),
            record.name,
            (record.values ?? []).map(valueToDomain),
            record.lines.map(lineToDomain),
        );
    },
};
