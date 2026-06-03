import { AggregateRoot } from '../../_common/domain/aggregate';
import { ValidationError } from '../../_common/domain/errors';
import { domainEvent } from '../../_common/domain/domain-event';
import { Percentage } from '../../_common/domain/percentage';

/** How the final quote price is rounded. */
export type Rounding = 'NONE' | 'MULTIPLE_OF_5';

/** When stock is deducted: on quote approval or when production starts. */
export type StockDeductionMoment = 'ON_APPROVAL' | 'ON_PRODUCTION';

/** UI language for the application. */
export type Language = 'es' | 'en';

/** Predefined scaling factor for the quote UI (½, 1, 2…). */
export interface ScalingFactor {
  code: number;
  label: string;
  order: number;
}

/** Sellable size with its factor (chico 0.5, mediano 1, grande 2). */
export interface BusinessSize {
  name: string;
  factor: number;
}

/**
 * Manual inventory adjustment type and its sign:
 * -1 subtracts (waste, damage, expiry) · +1 adds (return) ·
 *  0 uses the sign entered by the user (count).
 */
export interface AdjustmentType {
  name: string;
  sign: -1 | 0 | 1;
}

export interface GeneralSettings {
  laborRatePerHour: number;
  indirectCostPerOrder: number;
  depreciationPerOrder: number;
  defaultMargin: number;
  applyIgv: boolean;
  igvRate: number;
  rounding: Rounding;
  quoteExpiryDays: number;
  stockDeductionMoment: StockDeductionMoment;
  businessName: string;
  language: Language;
}

/** EXACT defaults from the GAS installer (src/Esquema.js / Configuracion.js). */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  laborRatePerHour: 12,
  indirectCostPerOrder: 5,
  depreciationPerOrder: 3,
  defaultMargin: 35,
  applyIgv: true,
  igvRate: 18,
  rounding: 'MULTIPLE_OF_5',
  quoteExpiryDays: 15,
  stockDeductionMoment: 'ON_APPROVAL',
  businessName: 'Sistema',
  language: 'es',
};

export const DEFAULT_SCALING_FACTORS: ScalingFactor[] = [
  { code: 0.25, label: '1/4', order: 1 },
  { code: 0.5, label: '1/2', order: 2 },
  { code: 1, label: '1', order: 3 },
  { code: 2, label: '2', order: 4 },
  { code: 3, label: '3', order: 5 },
];

// Size NAMES stay in Spanish on purpose: they are business data the baker
// defined and the tutorial references them ('grande').
export const DEFAULT_SIZES: BusinessSize[] = [
  { name: 'chico', factor: 0.5 },
  { name: 'mediano', factor: 1 },
  { name: 'grande', factor: 2 },
];

export const DEFAULT_ADJUSTMENT_TYPES: AdjustmentType[] = [
  { name: 'waste', sign: -1 },
  { name: 'damage', sign: -1 },
  { name: 'expiry', sign: -1 },
  { name: 'count', sign: 0 },
  { name: 'return', sign: 1 },
];

export interface SettingsPrimitives {
  id: string; // singleton: 'SETTINGS'
  general: GeneralSettings;
  factors: ScalingFactor[];
  sizes: BusinessSize[];
  adjustmentTypes: AdjustmentType[];
}

export const SETTINGS_ID = 'SETTINGS';

const VALID_LANGUAGES: readonly Language[] = ['es', 'en'];

/**
 * Business settings: a SINGLETON aggregate. It defines the rules used to build
 * the price and the lists the forms use. Changing it only affects NEW quotes
 * (saved ones are frozen).
 */
export class BusinessSettings extends AggregateRoot {
  private constructor(
    private _general: GeneralSettings,
    private _factors: ScalingFactor[],
    private _sizes: BusinessSize[],
    private _adjustmentTypes: AdjustmentType[],
  ) {
    super();
  }

  /** The factory settings (fresh install). */
  static default(): BusinessSettings {
    return new BusinessSettings(
      { ...DEFAULT_GENERAL_SETTINGS },
      DEFAULT_SCALING_FACTORS.map(f => ({ ...f })),
      DEFAULT_SIZES.map(s => ({ ...s })),
      DEFAULT_ADJUSTMENT_TYPES.map(t => ({ ...t })),
    );
  }

  static fromPrimitives(p: SettingsPrimitives): BusinessSettings {
    return new BusinessSettings(
      { ...p.general },
      p.factors.map(f => ({ ...f })),
      p.sizes.map(s => ({ ...s })),
      p.adjustmentTypes.map(t => ({ ...t })),
    );
  }

  /** Edits the general settings (Flow 13 in the manual). */
  updateGeneral(changes: Partial<GeneralSettings>): void {
    const next = { ...this._general, ...changes };
    BusinessSettings.validateGeneral(next);
    this._general = next;
    this.recordEvent(
      domainEvent('SettingsUpdated', SETTINGS_ID, { changed: Object.keys(changes) }),
    );
  }

  replaceSizes(sizes: BusinessSize[]): void {
    if (!sizes.length) throw new ValidationError('Define at least one size.');
    for (const s of sizes) {
      if (!s.name.trim()) throw new ValidationError('Every size needs a name.');
      if (!Number.isFinite(s.factor) || s.factor <= 0) {
        throw new ValidationError(`Invalid factor for "${s.name}": ${s.factor}.`);
      }
    }
    this._sizes = sizes.map(s => ({ name: s.name.trim().toLowerCase(), factor: s.factor }));
    this.recordEvent(domainEvent('SettingsUpdated', SETTINGS_ID, { changed: ['sizes'] }));
  }

  /* ---------- Queries used by the rest of the domain ---------- */

  get general(): Readonly<GeneralSettings> {
    return this._general;
  }
  get factors(): readonly ScalingFactor[] {
    return [...this._factors].sort((a, b) => a.order - b.order);
  }
  get sizes(): readonly BusinessSize[] {
    return this._sizes;
  }
  get adjustmentTypes(): readonly AdjustmentType[] {
    return this._adjustmentTypes;
  }

  /** Factor of a size (per-size quote calculation). */
  factorOfSize(name: string): number {
    const wanted = name.trim().toLowerCase();
    const size = this._sizes.find(s => s.name === wanted);
    if (!size) throw new ValidationError(`The size "${name}" is not defined in settings.`);
    return size.factor;
  }

  /**
   * Signed quantity of a manual adjustment (signoAjuste in src/Inventario.js):
   * sign -1 → subtracts |quantity| · +1 → adds |quantity| · 0 → keeps the sign.
   */
  signedAdjustmentQuantity(type: string, quantity: number): number {
    const def = this._adjustmentTypes.find(t => t.name === type.trim().toLowerCase());
    if (!def) throw new ValidationError(`Unknown adjustment type: "${type}".`);
    if (!Number.isFinite(quantity) || quantity === 0) {
      throw new ValidationError('The adjustment quantity cannot be 0.');
    }
    if (def.sign === 0) return quantity;
    return def.sign * Math.abs(quantity);
  }

  toPrimitives(): SettingsPrimitives {
    return {
      id: SETTINGS_ID,
      general: { ...this._general },
      factors: this._factors.map(f => ({ ...f })),
      sizes: this._sizes.map(s => ({ ...s })),
      adjustmentTypes: this._adjustmentTypes.map(t => ({ ...t })),
    };
  }

  private static validateGeneral(g: GeneralSettings): void {
    const nonNegative: [string, number][] = [
      ['labor rate', g.laborRatePerHour],
      ['indirect cost', g.indirectCostPerOrder],
      ['depreciation', g.depreciationPerOrder],
    ];
    for (const [name, value] of nonNegative) {
      if (!Number.isFinite(value) || value < 0) {
        throw new ValidationError(`The ${name} cannot be negative.`);
      }
    }
    Percentage.of(g.defaultMargin); // [0,100): protects cost/(1−margin)
    Percentage.of(g.igvRate);
    if (!Number.isInteger(g.quoteExpiryDays) || g.quoteExpiryDays < 1) {
      throw new ValidationError('Quote expiry days must be an integer ≥ 1.');
    }
    if (!g.businessName.trim()) {
      throw new ValidationError('The business name is required.');
    }
    if (!VALID_LANGUAGES.includes(g.language)) {
      throw new ValidationError(`Invalid language: "${g.language}". Use 'es' or 'en'.`);
    }
  }
}
