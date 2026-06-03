import { describe, expect, it } from 'vitest';
import { ValidationError } from './errors';
import { Percentage } from './percentage';
import { Quantity } from './quantity';

describe('Quantity (VO)', () => {
  it('scales by factor (the basis of quoting)', () => {
    const flour = Quantity.of(300, 'g');
    expect(flour.scaleBy(2).value).toBe(600);
    expect(flour.scaleBy(2).unit).toBe('g');
  });

  it('does not mix units', () => {
    expect(() => Quantity.of(1, 'g').add(Quantity.of(1, 'u'))).toThrow(ValidationError);
  });

  it('rejects negatives except the signed constructor (movements)', () => {
    expect(() => Quantity.of(-5, 'g')).toThrow(ValidationError);
    expect(Quantity.signed(-5, 'g').value).toBe(-5);
  });
});

describe('Percentage (VO)', () => {
  it('accepts [0,100) and exposes the fraction', () => {
    expect(Percentage.of(35).fraction).toBe(0.35);
    expect(Percentage.of(0).fraction).toBe(0);
  });

  it('rejects 100 (protects margin-on-sale) and out of range', () => {
    expect(() => Percentage.of(100)).toThrow(ValidationError);
    expect(() => Percentage.of(-1)).toThrow(ValidationError);
  });
});
