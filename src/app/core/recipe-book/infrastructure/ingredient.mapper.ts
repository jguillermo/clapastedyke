import { EntityId } from '../../_common/entity-id';
import { Ingredient } from '../domain/entities/ingredient';
import { IngredientRecord } from './records';

export const IngredientMapper = {
    toRecord(ingredient: Ingredient): IngredientRecord {
        return { id: ingredient.id.value, name: ingredient.name, baseUnit: ingredient.baseUnit };
    },

    toDomain(record: IngredientRecord): Ingredient {
        return Ingredient.create(new EntityId(record.id), record.name, record.baseUnit);
    },
};
