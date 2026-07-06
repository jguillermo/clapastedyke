import { EntityId } from '../../_common/entity-id';
import { Quantity } from '../../_common/quantity';
import { SupplyLine } from '../domain/value-objects/supply-line';
import { SupplyLineRecord, QuantityRecord } from './records';

/** Traducciones VO ⇄ record compartidas, reutilizadas por los mappers de agregados. */

export const quantityToRecord = (q: Quantity): QuantityRecord => ({ value: q.value, unit: q.unit });

export const quantityToDomain = (r: QuantityRecord): Quantity => Quantity.of(r.value, r.unit);

export const lineToRecord = (line: SupplyLine): SupplyLineRecord => ({
    // Clave persistida legacy `ingredientId` conservada; el dominio la expone como `supplyId`.
    ingredientId: line.supplyId.value,
    quantity: quantityToRecord(line.quantity),
});

export const lineToDomain = (r: SupplyLineRecord): SupplyLine =>
    SupplyLine.of(new EntityId(r.ingredientId), quantityToDomain(r.quantity));
