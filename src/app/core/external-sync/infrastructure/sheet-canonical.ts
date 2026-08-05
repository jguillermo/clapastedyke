/**
 * Cómo se convierte **un valor cualquiera en la única cadena que lo representa**, venga del modelo de
 * la app o de una celda de la hoja.
 *
 * ## Por qué esto es el cimiento de todo
 *
 * La huella de una fila se calcula **dos veces**: aquí sobre las filas locales (donde un precio es un
 * `number`) y aquí sobre las celdas leídas de la hoja (donde puede ser un `number`, un texto que
 * escribió una persona, o el texto que escribió la propia app). Si las dos veces no sale
 * **exactamente** la misma cadena, la fila parece editada a mano **en cada ciclo**: cada dispositivo
 * la re-estampa, el otro la vuelve a ver distinta, y los dos se pisan para siempre quemando cuota.
 *
 * Y no se nota. Con un solo dispositivo no pasa nada raro, y en un test los dos lados atraviesan este
 * mismo código en el mismo proceso, así que coinciden por accidente. Se nota semanas después, como
 * «la hoja no para de cambiar sola».
 *
 * De ahí las dos reglas que gobiernan este fichero:
 *
 * 1. **Un solo dueño.** Solo `external-sync` canoniza y solo `external-sync` calcula huellas.
 *    `recipe-book` entrega sus filas tal cual y no sabe que esto existe.
 * 2. **Determinismo antes que belleza.** `0.1 + 0.2` se canoniza como `'0.30000000000000004'` y
 *    `1e21` como `'1e+21'`, que son feos y son *correctos*: lo único que importa es que la ida y la
 *    vuelta den lo mismo. Redondear «para que quede bonito» perdería datos del usuario.
 *
 * ## Cómo se mantiene deterministico un número
 *
 * `String(Number(x))` es la representación más corta que vuelve al mismo número, y JavaScript la
 * calcula igual en todas partes. Da lo mismo por dónde entre el valor:
 *
 * | Origen | Valor que llega | Canónico |
 * |---|---|---|
 * | la app | `2.5` (número) | `'2.5'` |
 * | la app, ida y vuelta por la hoja | `'2.5'` (texto) | `'2.5'` |
 * | una persona que teclea `2,50` | `'2,50'` | `'2.5'` |
 * | una persona que teclea `2.50` | `2.5` (Sheets lo guarda como número) | `'2.5'` |
 *
 * **Se lee con `UNFORMATTED_VALUE`**, sin excepción. Con el formateado, Sheets aplica el formato de la
 * celda y la configuración regional de quien la creó, y un precio podría volver como `'2,50'` o
 * `'1.234,56'` según el idioma de la hoja: la huella dependería del país del usuario.
 *
 * ## Esto es para COMPARAR, no para escribir
 *
 * Lo canónico sirve para dos cosas: calcular la huella y **emparejar filas por su id**. Lo que se
 * escribe en la hoja es lo que da el modelo, con sus mayúsculas y su formato: nadie va a ver
 * `pen` donde escribió `PEN`. La única forma canónica que también es identidad es la del `id`.
 */

/** Qué clase de valor lleva una columna, y por tanto cómo se canoniza. */
export type FieldKind =
  /** Texto libre que el usuario ve y edita: un nombre, una etiqueta. */
  | 'text'
  /** Un número: precio, cantidad, factor. */
  | 'number'
  /** Un valor de un conjunto cerrado (`g`/`u`, `recipe`, `portions`) o un id. Sin mayúsculas. */
  | 'code'
  /** Un sí/no. */
  | 'flag'
  /** Columna que la app recalcula sola: **fuera de la huella y fuera de la fusión**. */
  | 'derived'
  /** Columna de servicio de la sincronización: no es dato del usuario. */
  | 'metadata';

/**
 * Lo que se escribe en una celda de sí/no. La app siempre escribe esto; al leer se es **permisivo**
 * (ver `canonicalFlag`), porque una persona escribe `Sí`, `x` o marca una casilla.
 */
export const FLAG_TRUE = 'TRUE';

/** Lo que no es un sí. Cualquier otra cosa no vacía cuenta como sí. */
const FLAG_FALSE_VALUES = new Set(['', 'false', 'no', '0', 'n', 'falso']);

/**
 * Un valor tal y como puede llegar: del modelo de la app (número, texto, `null`) o de una celda leída
 * (texto, número, booleano, o nada si la fila venía corta).
 */
export type RawValue = unknown;

/** Texto: se recorta y se normaliza en NFC. */
export function canonicalText(value: RawValue): string {
  if (value === null || value === undefined) {
    return '';
  }
  // NFC porque «á» se puede codificar de dos maneras y no siempre vuelve como se mandó. Sin esto,
  // cualquier nombre acentuado sería una edición a mano permanente.
  return String(value).trim().normalize('NFC');
}

/** Como `canonicalText`, sin mayúsculas: para ids y valores de conjuntos cerrados. */
export function canonicalCode(value: RawValue): string {
  return canonicalText(value).toLowerCase();
}

/**
 * Número: **la misma cadena** salga de un `number` o del texto de una celda. `null` si eso no es un
 * número, y entonces la fila no se puede leer (quien pregunta decide, aquí no se lanza).
 */
export function canonicalNumber(value: RawValue): string | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? stringify(value) : null;
  }
  if (value === null || value === undefined) {
    return null;
  }

  const text = canonicalText(value);
  if (text.length === 0) {
    return null;
  }

  const parsed = Number(decimalSeparator(text));
  return Number.isFinite(parsed) ? stringify(parsed) : null;
}

/** Sí/no. Permisivo al leer: una persona no escribe `TRUE`. */
export function canonicalFlag(value: RawValue): string {
  if (typeof value === 'boolean') {
    return value ? FLAG_TRUE : '';
  }
  const text = canonicalText(value).toLowerCase();
  return FLAG_FALSE_VALUES.has(text) ? '' : FLAG_TRUE;
}

/** Canoniza según la clase de columna. `null` solo cuando un número no se puede leer. */
export function canonicalValue(kind: FieldKind, value: RawValue): string | null {
  switch (kind) {
    case 'number':
      return canonicalNumber(value);
    case 'code':
      return canonicalCode(value);
    case 'flag':
      return canonicalFlag(value);
    case 'text':
    case 'derived':
    case 'metadata':
      return canonicalText(value);
  }
}

/**
 * La clase de cada columna, por tabla.
 *
 * Es la lista que decide **qué entra en la huella**: todo lo que no sea `derived` ni `metadata`. Las
 * `derived` son columnas que la app recalcula de un id (el nombre de la categoría en la fila de la
 * receta, el número de insumos): si entraran, renombrar una categoría convertiría sus cuarenta recetas
 * en falsas ediciones manuales, con cuarenta versiones nuevas que le ganarían a ediciones legítimas de
 * otro dispositivo.
 *
 * Un `spec` comprueba que esto cuadre columna por columna con `SHEET_TABLES`, para que añadir un campo
 * al esquema sin clasificarlo aquí falle en los tests y no en la hoja de alguien.
 */
export const FIELD_KINDS: Readonly<Record<string, Readonly<Record<string, FieldKind>>>> = {
  supplies: {
    id: 'code',
    name: 'text',
    baseUnit: 'code',
    usage: 'code',
    priceAmount: 'number',
    pricePerValue: 'number',
    pricePerUnit: 'code',
    currency: 'code',
    syncedAt: 'metadata',
  },
  recipes: {
    id: 'code',
    name: 'text',
    categoryId: 'code',
    categoryName: 'derived',
    flavorId: 'code',
    flavorLabel: 'derived',
    portionsCapacityId: 'code',
    portionsCapacityLabel: 'derived',
    moldCapacityId: 'code',
    moldCapacityLabel: 'derived',
    lineCount: 'derived',
    syncedAt: 'metadata',
  },
  recipeLines: {
    recipeId: 'code',
    recipeName: 'derived',
    supplyId: 'code',
    supplyName: 'derived',
    quantity: 'number',
    unit: 'code',
    syncedAt: 'metadata',
  },
  categories: { id: 'code', name: 'text', syncedAt: 'metadata' },
  flavors: { id: 'code', label: 'text', syncedAt: 'metadata' },
  capacities: {
    id: 'code',
    group: 'code',
    label: 'text',
    factor: 'number',
    syncedAt: 'metadata',
  },
};

/** Las columnas de una tabla que cuentan como dato del usuario, en el orden del esquema. */
export function authoritativeFields(table: string, fields: readonly string[]): readonly string[] {
  const kinds = FIELD_KINDS[table] ?? {};
  return fields.filter((field) => {
    const kind = kinds[field];
    // Un campo sin clasificar se considera dato: es lo prudente. Si alguien añade una columna al
    // esquema y olvida esta lista, la huella la incluirá (y el spec de coherencia se quejará) en vez
    // de ignorarla en silencio, que es como se pierden datos.
    return kind !== 'derived' && kind !== 'metadata';
  });
}

/** Una fila que no se puede canonizar, con la primera columna culpable. */
export interface UnreadableRow {
  readonly field: string;
  readonly value: RawValue;
}

/**
 * Los valores canónicos de una fila, en el orden del esquema y **solo las columnas autoritativas**.
 *
 * Devuelve `{ unreadable }` en vez de lanzar cuando una celda numérica no es un número. Una excepción
 * aquí pararía el ciclo entero por una celda mal tecleada, y como la celda seguiría en la hoja,
 * pararía **igual para siempre**.
 */
export function canonicalRow(
  table: string,
  fields: readonly string[],
  read: (field: string) => RawValue,
): { values: readonly string[] } | { unreadable: UnreadableRow } {
  const kinds = FIELD_KINDS[table] ?? {};
  const values: string[] = [];

  for (const field of authoritativeFields(table, fields)) {
    const raw = read(field);
    const canonical = canonicalValue(kinds[field] ?? 'text', raw);
    if (canonical === null) {
      return { unreadable: { field, value: raw } };
    }
    values.push(canonical);
  }
  return { values };
}

/**
 * `-0` y `0` son el mismo número y tienen que dar la misma cadena: `String(-0)` ya devuelve `'0'`,
 * pero se deja explícito porque es justo el tipo de detalle que rompe una huella en silencio.
 */
function stringify(value: number): string {
  return value === 0 ? '0' : String(value);
}

/**
 * La coma decimal de quien teclea en español.
 *
 * Solo se traduce el caso **sin ambigüedad**: una coma y ningún punto. `1.234,56` y `1,234.56`
 * significan lo mismo en dos idiomas distintos y lo contrario en el otro, así que no se adivinan — se
 * dejan pasar y `Number` las rechazará, que es lo honesto: la fila se queda en cuarentena y el usuario
 * ve que esa celda no se puede leer.
 */
function decimalSeparator(text: string): string {
  const withoutSpaces = text.replace(/\s/g, '');
  const commas = (withoutSpaces.match(/,/g) ?? []).length;
  if (commas === 1 && !withoutSpaces.includes('.')) {
    return withoutSpaces.replace(',', '.');
  }
  return withoutSpaces;
}
