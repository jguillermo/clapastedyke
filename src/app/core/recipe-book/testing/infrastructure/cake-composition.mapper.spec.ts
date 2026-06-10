import { EntityId } from '../../../_common/entity-id';
import { Quantity } from '../../../_common/quantity';
import { CakeComposition } from '../../domain/entities/cake-composition';
import { CakeCompositionMapper } from '../../infrastructure/cake-composition.mapper';

describe('CakeCompositionMapper', () => {
    const build = (topperId?: EntityId) =>
        CakeComposition.compose({
            id: new EntityId('CK-1'),
            name: 'Torta 1 kg',
            targetWeight: Quantity.of(1000, 'g'),
            spongeRecipeId: new EntityId('SP-1'),
            fillingRecipeId: new EntityId('FL-1'),
            coveringRecipeId: new EntityId('CV-1'),
            topperId,
            suggestedBoxId: new EntityId('PK-box'),
            suggestedBaseId: new EntityId('PK-base'),
        });

    it('round-trips a composition with a topper', () => {
        const original = build(new EntityId('TP-1'));
        const restored = CakeCompositionMapper.toDomain(CakeCompositionMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.name).toBe('Torta 1 kg');
        expect(restored.targetWeight.value).toBe(1000);
        expect(restored.topperId?.value).toBe('TP-1');
        expect(restored.suggestedBoxId.value).toBe('PK-box');
    });

    it('round-trips a composition without a topper', () => {
        const restored = CakeCompositionMapper.toDomain(CakeCompositionMapper.toRecord(build()));
        expect(restored.topperId).toBeUndefined();
    });
});
