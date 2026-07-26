import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { SupplyLine } from '../../../domain/value-objects/supply-line';

describe('SupplyLine', () => {
    it('composes an ingredient id with a quantity', () => {
        const line = SupplyLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
        expect(line.supplyId.value).toBe('IN-1');
        expect(line.quantity.value).toBe(250);
    });

    it('rejects a non-positive quantity (via Quantity)', () => {
        expect(() => SupplyLine.of(new EntityId('IN-1'), Quantity.of(0, 'g'))).toThrow();
    });

    it('is equal by value', () => {
        const a = SupplyLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
        const b = SupplyLine.of(new EntityId('IN-1'), Quantity.of(250, 'g'));
        expect(a.equals(b)).toBe(true);
        expect(a.equals(SupplyLine.of(new EntityId('IN-2'), Quantity.of(250, 'g')))).toBe(false);
    });
});
