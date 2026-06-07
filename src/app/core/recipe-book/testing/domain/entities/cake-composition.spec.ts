import { EntityId } from '../../../../_common/entity-id';
import { Quantity } from '../../../../_common/quantity';
import { CakeComposition } from '../../../domain/entities/cake-composition';

const baseData = {
    id: new EntityId('CK-1'),
    targetWeight: Quantity.of(1000, 'g'),
    spongeRecipeId: new EntityId('RC-1'),
    fillingRecipeId: new EntityId('RC-2'),
    coveringRecipeId: new EntityId('RC-3'),
    topperId: new EntityId('TP-1'),
    suggestedBoxId: new EntityId('PK-box'),
    suggestedBaseId: new EntityId('PK-base'),
};

describe('CakeComposition', () => {
    it('composes with a positive target weight', () => {
        const cake = CakeComposition.compose(baseData);
        expect(cake.targetWeight.value).toBe(1000);
    });

    it('rejects a non-positive target weight (via Quantity)', () => {
        expect(() => CakeComposition.compose({ ...baseData, targetWeight: Quantity.of(0, 'g') })).toThrow();
    });

    it('recompose returns a new instance with the new weight', () => {
        const cake = CakeComposition.compose(baseData);
        const heavier = cake.recompose(Quantity.of(2000, 'g'));
        expect(heavier.targetWeight.value).toBe(2000);
        expect(cake.targetWeight.value).toBe(1000);
        expect(heavier).not.toBe(cake);
        expect(heavier.spongeRecipeId.value).toBe('RC-1');
    });

    it('is equal by id', () => {
        const a = CakeComposition.compose(baseData);
        const b = CakeComposition.compose({ ...baseData, targetWeight: Quantity.of(3000, 'g') });
        expect(a.equals(b)).toBe(true);
    });
});
