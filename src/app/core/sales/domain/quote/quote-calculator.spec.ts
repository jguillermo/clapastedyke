import { beforeEach, describe, expect, it } from 'vitest';
import { Money } from '../../../_common/domain/money';
import { ValidationError } from '../../../_common/domain/errors';
import { EntityId } from '../../../_common/domain/entity-id';
import { Supply } from '../../../catalog/domain/supply/supply';
import { Recipe } from '../../../catalog/domain/recipe/recipe';
import { BusinessSettings } from '../../../settings/domain/business-settings';
import { QuoteCalculator } from './quote-calculator';

/**
 * The user manual scenario, end to end:
 * Flour S/5×1000g, Egg S/15×30u, Box S/25×25u; chocolate cake based on 10
 * people with 300 g of flour, 4 eggs and 2 h of labor.
 * Factory settings except where noted.
 */
describe('QuoteCalculator (domain service)', () => {
  let recipe: Recipe;
  let supplies: Map<string, Supply>;
  let settings: BusinessSettings;
  const calculator = new QuoteCalculator();

  beforeEach(() => {
    const flour = Supply.create(EntityId.create('IN', 1), {
      name: 'Flour', type: 'ingredient', baseUnit: 'g',
      presentationSize: 1000, presentationPrice: Money.fromSoles(5),
    });
    const egg = Supply.create(EntityId.create('IN', 2), {
      name: 'Egg', type: 'ingredient', baseUnit: 'u',
      presentationSize: 30, presentationPrice: Money.fromSoles(15),
    });
    const box = Supply.create(EntityId.create('IN', 3), {
      name: 'Cake box', type: 'packaging', baseUnit: 'u',
      presentationSize: 25, presentationPrice: Money.fromSoles(25),
    });
    supplies = new Map([
      [flour.id.value, flour],
      [egg.id.value, egg],
      [box.id.value, box],
    ]);
    recipe = Recipe.create(EntityId.create('RC', 1), {
      name: 'Chocolate cake', baseType: 'people', baseServings: 10,
      laborHours: 2,
      ingredients: [
        { supplyId: 'IN-0001', baseQuantity: 300 },
        { supplyId: 'IN-0002', baseQuantity: 4 },
      ],
    });
    settings = BusinessSettings.default();
  });

  it('reproduces the manual example: 20 people, box, margin 30, IGV, multiple of 5', () => {
    const calc = calculator.calculate(recipe, supplies, settings, {
      scalingMode: 'people', scalingValue: 20,
      packaging: [{ supplyId: 'IN-0003', quantity: 1 }],
      margin: 30, applyIgv: true,
    });

    expect(calc.factor).toBe(2);
    expect(calc.resultingServings).toBe(20);
    // Ingredients: 600 g × 0.005 + 8 u × 0.5 = 3 + 4 = 7
    expect(calc.ingredientsCost.soles).toBe(7);
    // Box: 1 × (25/25) = 1 — NOT scaled by the factor
    expect(calc.materialsCost.soles).toBe(1);
    // Labor: 2 h × factor 2 × rate 12 = 48 · fixed: 5 + 3
    expect(calc.laborCost.soles).toBe(48);
    expect(calc.totalCost.soles).toBe(64);
    // Margin OVER THE SALE: 64 / 0.70 = 91.4286
    expect(calc.priceWithMargin.soles).toBeCloseTo(91.4286, 4);
    // IGV 18%: 16.4571 → gross price 107.8857 → multiple of 5: 110
    expect(calc.igvAmount.soles).toBeCloseTo(16.4571, 3);
    expect(calc.finalPrice.soles).toBe(110);
    expect(calc.roundingApplied.soles).toBeCloseTo(2.1143, 3);
    // Frozen detail: 2 ingredients + 1 material
    expect(calc.lines.map(l => l.kind)).toEqual(['ingredient', 'ingredient', 'material']);
  });

  it('the four scaling modes produce the same factor when equivalent', () => {
    const byPeople = calculator.calculate(recipe, supplies, settings, {
      scalingMode: 'people', scalingValue: 20, packaging: [], margin: 30, applyIgv: false,
    });
    const byFactor = calculator.calculate(recipe, supplies, settings, {
      scalingMode: 'factor', scalingValue: 2, packaging: [], margin: 30, applyIgv: false,
    });
    const bySize = calculator.calculate(recipe, supplies, settings, {
      scalingMode: 'size', size: 'grande', packaging: [], margin: 30, applyIgv: false,
    });
    expect(byFactor.factor).toBe(2);
    expect(bySize.factor).toBe(2); // grande → 2 in settings
    expect(byPeople.totalCost.equals(byFactor.totalCost)).toBe(true);
    expect(byPeople.totalCost.equals(bySize.totalCost)).toBe(true);
  });

  it('without IGV adds no tax; without rounding leaves the exact price', () => {
    settings.updateGeneral({ rounding: 'NONE' });
    const calc = calculator.calculate(recipe, supplies, settings, {
      scalingMode: 'people', scalingValue: 20, packaging: [], margin: 30, applyIgv: false,
    });
    expect(calc.igvAmount.soles).toBe(0);
    // 63 / 0.7 = 90 exact (no box: cost 63)
    expect(calc.finalPrice.soles).toBe(90);
    expect(calc.roundingApplied.soles).toBe(0);
  });

  it('validates scaling: value > 0, size defined', () => {
    const base = { packaging: [], margin: 30, applyIgv: false };
    expect(() =>
      calculator.calculate(recipe, supplies, settings, { ...base, scalingMode: 'people', scalingValue: 0 }),
    ).toThrow(ValidationError);
    expect(() =>
      calculator.calculate(recipe, supplies, settings, { ...base, scalingMode: 'size', size: 'gigante' }),
    ).toThrow(ValidationError);
  });
});
