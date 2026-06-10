import { EntityId } from '../../_common/entity-id';
import { Quantity } from '../../_common/quantity';
import { IngredientLine } from '../domain/value-objects/ingredient-line';
import { IngredientLineRecord, QuantityRecord } from './records';

/** Shared value-object ⇄ record translations reused across aggregate mappers. */

export const quantityToRecord = (q: Quantity): QuantityRecord => ({ value: q.value, unit: q.unit });

export const quantityToDomain = (r: QuantityRecord): Quantity => Quantity.of(r.value, r.unit);

export const lineToRecord = (line: IngredientLine): IngredientLineRecord => ({
    ingredientId: line.ingredientId.value,
    quantity: quantityToRecord(line.quantity),
});

export const lineToDomain = (r: IngredientLineRecord): IngredientLine =>
    IngredientLine.of(new EntityId(r.ingredientId), quantityToDomain(r.quantity));
