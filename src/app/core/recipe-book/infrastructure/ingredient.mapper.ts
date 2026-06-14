import { EntityId } from '../../_common/entity-id';
import { Ingredient } from '../domain/entities/ingredient';
import { PurchasePrice } from '../domain/value-objects/purchase-price';
import { IngredientRecord } from './records';
import { quantityToDomain, quantityToRecord } from './value-record.mappers';

export const IngredientMapper = {
    toRecord(ingredient: Ingredient): IngredientRecord {
        return {
            id: ingredient.id.value,
            name: ingredient.name,
            baseUnit: ingredient.baseUnit,
            usage: ingredient.usage,
            purchasePrice: {
                amount: ingredient.purchasePrice.amount,
                per: quantityToRecord(ingredient.purchasePrice.per),
            },
        };
    },

    toDomain(record: IngredientRecord): Ingredient {
        return Ingredient.restore({
            id: new EntityId(record.id),
            name: record.name,
            baseUnit: record.baseUnit,
            usage: record.usage,
            purchasePrice: PurchasePrice.of(record.purchasePrice.amount, quantityToDomain(record.purchasePrice.per)),
        });
    },
};
