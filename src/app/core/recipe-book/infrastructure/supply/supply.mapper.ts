import { EntityId } from '../../../_common/entity-id';
import { Supply } from '../../domain/entities/supply';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { SupplyRecord } from '../records';
import { quantityToDomain, quantityToRecord } from '../value-record.mappers';

/**
 * ACL de persistencia: traduce `Supply` ⇄ `SupplyRecord` (primitivos de IndexedDB).
 * Usado por `IndexedDbSupplyRepository`. Mapea los VOs `PurchasePrice` y `Quantity`
 * (la cantidad `per` vía `value-record.mappers`); aplica `'PEN'` por defecto a records legacy sin
 * moneda.
 *
 * **`updatedAt` solo viaja hacia el dominio.** Al escribir no se pone aquí: lo estampa el repositorio
 * con la hora de *ese* guardado. Si lo escribiera el mapper con el valor que trae el agregado, guardar
 * algo recién leído conservaría la fecha antigua y la sincronización creería que no ha cambiado.
 */
export const SupplyMapper = {
  toRecord(supply: Supply): SupplyRecord {
    return {
      id: supply.id.value,
      name: supply.name,
      baseUnit: supply.baseUnit,
      usage: supply.usage,
      purchasePrice: {
        amount: supply.purchasePrice.amount,
        per: quantityToRecord(supply.purchasePrice.per),
        currency: supply.purchasePrice.currency,
      },
    };
  },

  toDomain(record: SupplyRecord): Supply {
    return Supply.restore({
      id: new EntityId(record.id),
      name: record.name,
      baseUnit: record.baseUnit,
      usage: record.usage,
      purchasePrice: PurchasePrice.of(
        record.purchasePrice.amount,
        quantityToDomain(record.purchasePrice.per),
        record.purchasePrice.currency ?? 'PEN',
      ),
      updatedAt: record.updatedAt ?? null,
    });
  },
};
