import { EntityId } from '../../_common/entity-id';
import { PackagingItem } from '../domain/entities/packaging-item';
import { PackagingItemMapper } from './packaging-item.mapper';

describe('PackagingItemMapper', () => {
    it('round-trips a packaging item preserving its type', () => {
        const original = PackagingItem.create(new EntityId('PK-1'), 'Caja Nº 20', 'box');
        const restored = PackagingItemMapper.toDomain(PackagingItemMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.type).toBe('box');
    });
});
