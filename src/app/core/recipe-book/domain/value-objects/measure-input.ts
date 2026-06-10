import { Quantity, type BaseUnit } from '../../../_common/quantity';

/**
 * What a measure field represents:
 * - `mass`: a weight typed in kilos or grams (`1 kg`, `400`, `1,5 k`). Base unit `g`.
 * - `count`: a countable amount, always base unit `u` (e.g. 5 huevos).
 * - `any`: an ingredient-line amount whose nature is decided by what the user
 *   types — a `u` token (`6 u`) means count, otherwise it is mass. Used when the
 *   ingredient is created on the fly and its base unit is inferred from the
 *   quantity.
 */
export type MeasureKind = 'mass' | 'count' | 'any';

/** The unit resolved for display (the "ghost" hint shown inside the field). */
export type ResolvedUnit = 'kg' | 'g' | 'u';

/**
 * Below this magnitude a bare mass number (no explicit unit) is read as
 * **kilos**; at or above it, as **grams**. So `1` → 1 kg and `400` → 400 g.
 * A recipe-book interpretation rule — kept here, not in the shared kernel.
 */
export const KG_MAGNITUDE_THRESHOLD = 10;

/**
 * Interprets the free text a user types in a measure field into a domain
 * {@link Quantity}, and exposes the unit it resolved to so the view can show it
 * (the ghost placeholder) — the view never decides the unit nor converts.
 *
 * Rules (value semantics, no side effects — hence a value object with a `parse`
 * factory, like `Quantity.of`):
 * - **Explicit unit wins**: a trailing token starting with `k` (`k`, `kg`,
 *   `kilo`…) means kilos; `g` (`g`, `gr`, `gramos`…) grams; `u` (`u`, `und`…)
 *   units (only meaningful for `count`/`any`).
 * - **No token → magnitude**: `value < KG_MAGNITUDE_THRESHOLD` → kg, else g.
 * - Always normalised to the domain base unit: grams (`g`) for mass, `u` for
 *   count. Read {@link quantity} for the value to send to a use case and
 *   {@link baseUnit} for the unit to persist a newly-created ingredient with.
 * - Accepts comma or dot as decimal separator (`1,5` ≡ `1.5`). Invalid (empty,
 *   non-numeric, ≤ 0, or a unit token that doesn't fit the kind) → {@link
 *   isValid} is `false`, while {@link unit} still holds the unit the field is
 *   currently considering (for the live hint).
 */
export class MeasureInput {
    private constructor(
        readonly raw: string,
        /** Normalised quantity in base unit (`g`/`u`), or `null` when invalid. */
        readonly quantity: Quantity | null,
        /** Unit resolved for display; defined even when the input is invalid. */
        readonly unit: ResolvedUnit,
        /** Domain base unit to persist with (`g` for any mass, `u` for counts). */
        readonly baseUnit: BaseUnit,
    ) {}

    get isValid(): boolean {
        return this.quantity !== null;
    }

    static parse(raw: string, kind: MeasureKind): MeasureInput {
        const text = (raw ?? '').trim();

        if (kind === 'count') {
            const amount = parseAmount(text);
            const quantity = amount !== null && amount > 0 ? Quantity.of(amount, 'u') : null;
            return new MeasureInput(raw, quantity, 'u', 'u');
        }

        const { amount, token } = splitAmountAndToken(text);

        let unit: ResolvedUnit;
        let baseUnit: BaseUnit;
        if (token === 'u' && kind === 'any') {
            unit = 'u';
            baseUnit = 'u';
        } else if (token === 'k') {
            unit = 'kg';
            baseUnit = 'g';
        } else if (token === 'g') {
            unit = 'g';
            baseUnit = 'g';
        } else if (amount !== null) {
            unit = amount < KG_MAGNITUDE_THRESHOLD ? 'kg' : 'g';
            baseUnit = 'g';
        } else {
            unit = 'kg'; // provisional hint before a number is typed
            baseUnit = 'g';
        }

        const tokenFitsKind = token === null || token === 'k' || token === 'g' || (token === 'u' && kind === 'any');
        const usable = amount !== null && amount > 0 && tokenFitsKind;

        let quantity: Quantity | null = null;
        if (usable) {
            quantity =
                baseUnit === 'u'
                    ? Quantity.of(amount as number, 'u')
                    : Quantity.of(unit === 'kg' ? (amount as number) * 1000 : (amount as number), 'g');
        }

        return new MeasureInput(raw, quantity, unit, baseUnit);
    }

    equals(other: MeasureInput): boolean {
        const sameQuantity =
            this.quantity === null
                ? other.quantity === null
                : other.quantity !== null && this.quantity.equals(other.quantity);
        return sameQuantity && this.unit === other.unit;
    }

    toString(): string {
        return this.quantity ? this.quantity.toString() : `∅ ${this.unit}`;
    }
}

/** Parses a bare amount (no unit), accepting comma or dot decimals. */
function parseAmount(text: string): number | null {
    if (!/^\d*[.,]?\d+$/.test(text)) {
        return null;
    }
    const value = Number(text.replace(',', '.'));
    return Number.isFinite(value) ? value : null;
}

/**
 * Splits a measure input into its numeric amount and a normalised unit token:
 * `'k'` (kilos), `'g'` (grams), `'u'` (units), `null` (no token) or `'unknown'`
 * (a token that is none of the above → invalid).
 */
function splitAmountAndToken(text: string): {
    amount: number | null;
    token: 'k' | 'g' | 'u' | 'unknown' | null;
} {
    const match = text.replace(',', '.').match(/^(\d*\.?\d+)\s*([a-zA-Z]+)?$/);
    if (!match) {
        return { amount: null, token: null };
    }
    const amount = Number(match[1]);
    const rawToken = match[2]?.toLowerCase();
    let token: 'k' | 'g' | 'u' | 'unknown' | null;
    if (!rawToken) {
        token = null;
    } else if (rawToken.startsWith('k')) {
        token = 'k';
    } else if (rawToken.startsWith('g')) {
        token = 'g';
    } else if (rawToken.startsWith('u')) {
        token = 'u';
    } else {
        token = 'unknown';
    }
    return { amount: Number.isFinite(amount) ? amount : null, token };
}
