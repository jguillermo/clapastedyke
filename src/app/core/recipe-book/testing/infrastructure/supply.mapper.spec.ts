import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { Supply } from '../../domain/entities/supply';
import { PurchasePrice } from '../../domain/value-objects/purchase-price';
import { SupplyMapper } from '../../infrastructure/supply.mapper';

describe('SupplyMapper', () => {
    it('round-trips an ingredient (with usage and purchase price) through its record', () => {
        const original = Supply.create(
            new EntityId('IN-1'),
            'Harina',
            'g',
            'recipe',
            PurchasePrice.of(5, Quantity.of(1000, 'g')),
        );
        const restored = SupplyMapper.toDomain(SupplyMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.name).toBe('Harina');
        expect(restored.baseUnit).toBe('g');
        expect(restored.usage).toBe('recipe');
        expect(restored.purchasePrice.amount).toBe(5);
        expect(restored.purchasePrice.per.value).toBe(1000);
    });
});
