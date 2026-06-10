import { EntityId } from '../entity-id';

describe('EntityId', () => {
    it('is equal by value', () => {
        expect(new EntityId('IN-1').equals(new EntityId('IN-1'))).toBe(true);
        expect(new EntityId('IN-1').equals(new EntityId('IN-2'))).toBe(false);
    });

    it('exposes its value through toString', () => {
        expect(new EntityId('RC-7').toString()).toBe('RC-7');
    });

    it('rejects empty or blank values', () => {
        expect(() => new EntityId('')).toThrow();
        expect(() => new EntityId('   ')).toThrow();
    });
});
