import { Quantity } from '../../../../_common/quantity';
import { PurchasePrice } from '../../../domain/value-objects/purchase-price';

describe('PurchasePrice', () => {
    it('derives the cost per base unit (price per gram)', () => {
        const price = PurchasePrice.of(5, Quantity.of(1000, 'g'));
        expect(price.perBaseUnit()).toBeCloseTo(0.005, 6);
    });

    it('costs a quantity by rule of three', () => {
        const price = PurchasePrice.of(5, Quantity.of(1000, 'g'));
        expect(price.costFor(Quantity.of(300, 'g'))).toBeCloseTo(1.5, 6);
    });

    it('works for countable units (eggs by the tray)', () => {
        const price = PurchasePrice.of(12, Quantity.of(30, 'u'));
        expect(price.costFor(Quantity.of(4, 'u'))).toBeCloseTo(1.6, 6);
    });

    it('rejects pricing a quantity in a different unit than the purchase', () => {
        const price = PurchasePrice.of(5, Quantity.of(1000, 'g'));
        expect(() => price.costFor(Quantity.of(2, 'u'))).toThrow();
    });

    it('rejects a non-positive amount', () => {
        expect(() => PurchasePrice.of(0, Quantity.of(1000, 'g'))).toThrow();
    });

    it('compares by value and renders a reference string', () => {
        const a = PurchasePrice.of(5, Quantity.of(1000, 'g'));
        const b = PurchasePrice.of(5, Quantity.of(1000, 'g'));
        expect(a.equals(b)).toBe(true);
        expect(a.toString()).toContain('S/ 5');
    });
});
