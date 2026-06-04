import { describe, expect, it } from 'vitest';
import { ValidationError } from './errors';
import { Money } from './money';

describe('Money (VO)', () => {
  it('stores integer ten-thousandths and exposes soles', () => {
    const m = Money.fromSoles(12.5);
    expect(m.tenThousandths).toBe(125_000);
    expect(m.soles).toBe(12.5);
    expect(m.cents).toBe(1250);
  });

  it('is immutable: operations return new instances', () => {
    const base = Money.fromSoles(10);
    const sum = base.add(Money.fromSoles(2.5));
    expect(base.soles).toBe(10);
    expect(sum.soles).toBe(12.5);
    expect(sum).not.toBe(base);
  });

  it('represents base-unit prices with exact 4 decimals (GAS case)', () => {
    // Flour: S/ 5 per 1000 g bag → 0.005 per gram; 300 g → S/ 1.50
    const perGram = Money.fromSoles(5).divideBy(1000);
    expect(perGram.soles).toBe(0.005);
    expect(perGram.multiplyBy(300).soles).toBe(1.5);
    // Egg: S/ 15 ÷ 30 = 0.50; 8 eggs → S/ 4
    expect(Money.fromSoles(15).divideBy(30).multiplyBy(8).soles).toBe(4);
  });

  it('equality by value', () => {
    expect(Money.fromSoles(3).equals(Money.fromSoles(3))).toBe(true);
    expect(Money.fromSoles(3).equals(Money.fromSoles(3.0001))).toBe(false);
  });

  it('rejects invalid amounts', () => {
    expect(() => Money.fromSoles(NaN)).toThrow(ValidationError);
    expect(() => Money.fromSoles(10).divideBy(0)).toThrow(ValidationError);
  });

  it('formats in es-PE soles (2 and 4 decimals)', () => {
    expect(Money.fromSoles(1234.5).format()).toBe('S/ 1,234.50');
    expect(Money.fromSoles(5).divideBy(1000).format4()).toBe('0.0050');
  });
});
