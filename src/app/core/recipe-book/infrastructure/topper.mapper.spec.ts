import { EntityId } from '../../_common/entity-id';
import { Topper } from '../domain/entities/topper';
import { TopperMapper } from './topper.mapper';

describe('TopperMapper', () => {
    it('round-trips a topper', () => {
        const original = Topper.create(new EntityId('TP-1'), 'Feliz cumpleaños');
        const restored = TopperMapper.toDomain(TopperMapper.toRecord(original));

        expect(restored.equals(original)).toBe(true);
        expect(restored.name).toBe('Feliz cumpleaños');
    });
});
