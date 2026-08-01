import { EntityId } from '../../_common/entity-id';
import { Quantity } from '../../_common/quantity';
import { RecipeIngredient } from '../domain/value-objects/recipe-ingredient';
import { RecipeIngredientRecord, QuantityRecord } from './records';

/** Traducciones VO ⇄ record compartidas, reutilizadas por los mappers de agregados. */

export const quantityToRecord = (q: Quantity): QuantityRecord => ({ value: q.value, unit: q.unit });

export const quantityToDomain = (r: QuantityRecord): Quantity => Quantity.of(r.value, r.unit);

export const ingredientToRecord = (ingredient: RecipeIngredient): RecipeIngredientRecord => ({
  // Clave persistida legacy `ingredientId` conservada; el dominio la expone como `supplyId`.
  ingredientId: ingredient.supplyId.value,
  quantity: quantityToRecord(ingredient.quantity),
});

export const ingredientToDomain = (r: RecipeIngredientRecord): RecipeIngredient =>
  RecipeIngredient.of(new EntityId(r.ingredientId), quantityToDomain(r.quantity));
