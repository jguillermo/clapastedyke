import { describe, expect, it } from 'vitest';
import { ValidationError } from './errors';
import { EntityId } from './entity-id';
import { MemoryIdGenerator } from '../infrastructure/memory/memory-store';

describe('EntityId (VO)', () => {
  it('creates ids with the legacy GAS format: prefix + 4 digits', () => {
    expect(EntityId.create('CL', 1).value).toBe('CL-0001');
    expect(EntityId.create('P', 42).value).toBe('P-0042');
    expect(EntityId.create('CMP', 12345).value).toBe('CMP-12345');
  });

  it('validates the format when rehydrating', () => {
    expect(EntityId.of('PD-0007').value).toBe('PD-0007');
    expect(() => EntityId.of('customer-1')).toThrow(ValidationError);
    expect(() => EntityId.of('CL-12')).toThrow(ValidationError);
  });

  it('equality by value', () => {
    expect(EntityId.of('CL-0001').equals(EntityId.create('CL', 1))).toBe(true);
  });

  it('the in-memory generator produces per-prefix sequences', async () => {
    const generator = new MemoryIdGenerator();
    expect((await generator.next('CL')).value).toBe('CL-0001');
    expect((await generator.next('CL')).value).toBe('CL-0002');
    expect((await generator.next('PR')).value).toBe('PR-0001');
  });
});
