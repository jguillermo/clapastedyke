import { Quantity, type BaseUnit } from '../../../_common/quantity';

/**
 * Qué representa un campo de medida:
 * - `mass`: un peso tecleado en kilos o gramos (`1 kg`, `400`, `1,5 k`). Unidad base `g`.
 * - `count`: una cantidad contable, siempre unidad base `u` (p. ej. 5 huevos).
 * - `any`: una cantidad de línea de insumo cuya naturaleza decide lo que el
 *   usuario teclea — un token `u` (`6 u`) significa conteo, en caso contrario es
 *   masa. Se usa cuando el insumo se crea al vuelo y su unidad base se
 *   infiere de la cantidad.
 */
export type MeasureKind = 'mass' | 'count' | 'any';

/** La unidad resuelta para mostrar (la pista "fantasma" dentro del campo). */
export type ResolvedUnit = 'kg' | 'g' | 'u';

/**
 * Por debajo de esta magnitud un número de masa pelado (sin unidad explícita) se
 * lee como **kilos**; a partir de ella, como **gramos**. Así `1` → 1 kg y
 * `400` → 400 g. Es una regla de interpretación del recetario — vive aquí, no en
 * el kernel compartido.
 */
export const KG_MAGNITUDE_THRESHOLD = 10;

/**
 * Interpreta el texto libre que el usuario teclea en un campo de medida hacia un
 * {@link Quantity} de dominio, y expone la unidad a la que resolvió para que la
 * vista la muestre (el placeholder fantasma) — la vista nunca decide la unidad
 * ni convierte.
 *
 * Reglas (semántica de valor, sin efectos secundarios — de ahí un value object
 * con una factory `parse`, como `Quantity.of`):
 * - **La unidad explícita manda**: un token final que empiece por `k` (`k`, `kg`,
 *   `kilo`…) significa kilos; `g` (`g`, `gr`, `gramos`…) gramos; `u` (`u`, `und`…)
 *   unidades (solo tiene sentido para `count`/`any`).
 * - **Sin token → magnitud**: `value < KG_MAGNITUDE_THRESHOLD` → kg, si no g.
 * - Siempre normalizado a la unidad base del dominio: gramos (`g`) para masa, `u`
 *   para conteo. Lee {@link quantity} para el valor a enviar a un use case y
 *   {@link baseUnit} para la unidad con la que persistir un insumo
 *   recién creado.
 * - Acepta coma o punto como separador decimal (`1,5` ≡ `1.5`). Inválido (vacío,
 *   no numérico, ≤ 0, o un token de unidad que no encaja con el kind) → {@link
 *   isValid} es `false`, mientras {@link unit} sigue con la unidad que el campo
 *   está considerando en ese momento (para la pista viva).
 */
export class MeasureInput {
  private constructor(
    readonly raw: string,
    /** Cantidad normalizada en unidad base (`g`/`u`), o `null` si es inválida. */
    readonly quantity: Quantity | null,
    /** Unidad resuelta para mostrar; definida incluso cuando el input es inválido. */
    readonly unit: ResolvedUnit,
    /** Unidad base del dominio con la que persistir (`g` para cualquier masa, `u` para conteos). */
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
      unit = 'kg'; // pista provisional antes de teclear un número
      baseUnit = 'g';
    }

    const tokenFitsKind =
      token === null || token === 'k' || token === 'g' || (token === 'u' && kind === 'any');
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

/** Parsea un monto pelado (sin unidad), aceptando decimales con coma o punto. */
function parseAmount(text: string): number | null {
  if (!/^\d*[.,]?\d+$/.test(text)) {
    return null;
  }
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/**
 * Divide un input de medida en su monto numérico y un token de unidad normalizado:
 * `'k'` (kilos), `'g'` (gramos), `'u'` (unidades), `null` (sin token) o `'unknown'`
 * (un token que no es ninguno de los anteriores → inválido).
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
