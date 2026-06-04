import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../_common/domain/errors';
import { BusinessSettings, DEFAULT_GENERAL_SETTINGS } from './business-settings';

describe('BusinessSettings (singleton aggregate)', () => {
  it('is born with the exact GAS installer defaults', () => {
    const settings = BusinessSettings.default();
    expect(settings.general).toEqual(DEFAULT_GENERAL_SETTINGS);
    expect(settings.general.defaultMargin).toBe(35);
    expect(settings.general.rounding).toBe('MULTIPLE_OF_5');
    expect(settings.general.stockDeductionMoment).toBe('ON_APPROVAL');
    expect(settings.general.language).toBe('es');
    expect(settings.factorOfSize('grande')).toBe(2);
    expect(settings.adjustmentTypes.map(t => t.name)).toContain('waste');
  });

  it('factorOfSize is case-insensitive and rejects undefined sizes', () => {
    const settings = BusinessSettings.default();
    expect(settings.factorOfSize('  Chico ')).toBe(0.5);
    expect(() => settings.factorOfSize('gigante')).toThrow(ValidationError);
  });

  it('signedAdjustmentQuantity replicates signoAjuste from GAS', () => {
    const settings = BusinessSettings.default();
    expect(settings.signedAdjustmentQuantity('waste', 5)).toBe(-5);
    expect(settings.signedAdjustmentQuantity('waste', -5)).toBe(-5); // always subtracts
    expect(settings.signedAdjustmentQuantity('return', 2)).toBe(2);
    expect(settings.signedAdjustmentQuantity('count', -8)).toBe(-8); // keeps the sign
    expect(settings.signedAdjustmentQuantity('count', 8)).toBe(8);
    expect(() => settings.signedAdjustmentQuantity('waste', 0)).toThrow(ValidationError);
    expect(() => settings.signedAdjustmentQuantity('theft', 1)).toThrow(ValidationError);
  });

  it('validates general settings on update (margin [0,100), days ≥ 1…)', () => {
    const settings = BusinessSettings.default();
    settings.updateGeneral({ defaultMargin: 40, businessName: 'Dulces Misa' });
    expect(settings.general.defaultMargin).toBe(40);
    expect(settings.pullEvents().map(e => e.name)).toEqual(['SettingsUpdated']);

    expect(() => settings.updateGeneral({ defaultMargin: 100 })).toThrow(ValidationError);
    expect(() => settings.updateGeneral({ quoteExpiryDays: 0 })).toThrow(ValidationError);
    expect(() => settings.updateGeneral({ laborRatePerHour: -1 })).toThrow(ValidationError);
  });

  it('updates the language and rejects invalid values', () => {
    const settings = BusinessSettings.default();
    expect(settings.general.language).toBe('es'); // default

    settings.updateGeneral({ language: 'en' });
    expect(settings.general.language).toBe('en');

    expect(() => settings.updateGeneral({ language: 'fr' as never })).toThrow(ValidationError);
  });

  it('replaceSizes normalizes names and requires factor > 0', () => {
    const settings = BusinessSettings.default();
    settings.replaceSizes([{ name: ' Familiar ', factor: 3 }]);
    expect(settings.factorOfSize('familiar')).toBe(3);
    expect(() => settings.replaceSizes([])).toThrow(ValidationError);
    expect(() => settings.replaceSizes([{ name: 'x', factor: 0 }])).toThrow(ValidationError);
  });
});
