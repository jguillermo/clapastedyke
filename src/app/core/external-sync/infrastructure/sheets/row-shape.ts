/**
 * Cómo se ve un registro de IndexedDB **dentro de una hoja de cálculo**, y cómo se vuelve a armar al
 * leerlo. Es la traducción entre «un documento con objetos dentro» y «una fila de celdas planas».
 *
 * ## Por qué hace falta, y por qué es simétrico o no es nada
 *
 * Una celda guarda un valor suelto: texto, número o booleano. Un registro no — `ingredients` lleva un
 * precio que es un objeto con otro objeto dentro, y `recipes` lleva una lista de líneas. Así que hay
 * que decidir **una** forma de bajarlo a celdas, y esa decisión tiene que ser reversible al pie de la
 * letra: lo que baja tiene que volver a subir idéntico.
 *
 * Si no lo fuera, el ciclo siguiente vería la fila distinta de como la escribió, la daría por editada
 * a mano, le pondría versión nueva, la reescribiría… y el dispositivo de al lado haría lo mismo con la
 * suya. **La hoja se reescribiría sola cada dos minutos, para siempre**, quemando cuota y pisando
 * ediciones de verdad. Es el fallo más caro de este contexto y el más difícil de ver: con un solo
 * dispositivo no se nota nada raro.
 *
 * Por eso el spec de este fichero coge **un registro de cada store que se replica**, lo baja a celdas,
 * lo vuelve a armar, lo baja otra vez y exige que salga exactamente lo mismo. Ese ida y vuelta es la
 * prueba, no la intención.
 *
 * ## Las tres formas
 *
 * | En el registro | En la hoja | Ejemplo |
 * |---|---|---|
 * | primitivo | una celda con el nombre del campo | `name` → `name` |
 * | objeto anidado | una celda **por hoja del árbol**, con la ruta separada por puntos | `purchasePrice.per.unit` |
 * | array | **una** celda con JSON, y la columna marcada con `[]` | `lines[]` |
 *
 * El objeto se despliega en columnas y el array no, y no es una inconsistencia: un objeto tiene un
 * juego de claves **fijo**, así que sus columnas son estables y una persona puede corregir un precio
 * en su celda. Un array tiene longitud variable: desplegarlo daría un número de columnas distinto por
 * fila, o una tabla hija sin identidad propia — que es justo el caso especial que este diseño elimina.
 *
 * ## La marca `[]` no es decorativa
 *
 * Al leer, una celda con `["a","b"]` es indistinguible de alguien que escribió ese texto. Adivinarlo
 * con un `JSON.parse` de prueba convertiría en lista cualquier texto que se le pareciera. La marca en
 * **la cabecera** lo dice sin ambigüedad y de paso avisa a quien mire la hoja de que esa columna es
 * una lista.
 */

import { canonicalText } from '../sheet-canonical';

/** Lo que marca a una columna como lista. Va en el nombre de la columna, no en la celda. */
export const ARRAY_SUFFIX = '[]';

/** Separador de las rutas de un objeto anidado. */
export const PATH_SEPARATOR = '.';

/** Una fila ya plana: nombre de columna → valor de la celda. */
export type Cells = Record<string, unknown>;

/** Un valor que no se pudo volver a armar, con la columna culpable. */
export interface UnreadableCell {
  readonly column: string;
  readonly value: unknown;
}

/**
 * Un registro bajado a celdas.
 *
 * Las claves con valor `null` o `undefined` **no producen columna**: no hay forma de distinguir en una
 * hoja «la celda está vacía» de «este campo no está», así que se elige la interpretación que no
 * inventa datos. La contrapartida, documentada y aceptada: un campo cuyo valor es la cadena vacía
 * vuelve como ausente. Ningún campo del modelo distingue hoy esas dos cosas.
 */
export function flatten(record: Readonly<Record<string, unknown>>): Cells {
  const cells: Cells = {};
  collect(record, '', cells);
  return cells;
}

function collect(value: Readonly<Record<string, unknown>>, prefix: string, cells: Cells): void {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix.length === 0 ? key : `${prefix}${PATH_SEPARATOR}${key}`;

    if (child === null || child === undefined) {
      continue;
    }
    if (Array.isArray(child)) {
      // JSON.stringify de un array es determinista: mismo orden, mismos separadores, siempre. Lo que
      // NO es determinista es el orden de las claves de los objetos de dentro, así que se normaliza.
      cells[`${path}${ARRAY_SUFFIX}`] = JSON.stringify(child, sortedKeys);
      continue;
    }
    if (isPlainObject(child)) {
      collect(child, path, cells);
      continue;
    }
    cells[path] = child;
  }
}

/**
 * Vuelve a armar el registro a partir de sus celdas. Devuelve `{ unreadable }` —nunca lanza— cuando
 * una celda marcada como lista no contiene una lista: una celda que alguien estropeó no puede parar la
 * sincronización de todo lo demás, y como la celda seguiría en la hoja, la pararía **para siempre**.
 *
 * Una celda vacía se trata como campo ausente, simétrico con `flatten`.
 */
export function rebuild(
  cells: Readonly<Cells>,
): { values: Record<string, unknown> } | { unreadable: UnreadableCell } {
  const values: Record<string, unknown> = {};

  for (const [column, value] of Object.entries(cells)) {
    if (value === null || value === undefined || canonicalText(value).length === 0) {
      continue;
    }

    if (column.endsWith(ARRAY_SUFFIX)) {
      const parsed = parseArray(value);
      if (parsed === null) {
        return { unreadable: { column, value } };
      }
      assign(values, column.slice(0, -ARRAY_SUFFIX.length), parsed);
      continue;
    }
    assign(values, column, value);
  }

  return { values };
}

/** Escribe `value` en la ruta `a.b.c` de `target`, creando los objetos intermedios que falten. */
function assign(target: Record<string, unknown>, path: string, value: unknown): void {
  const steps = path.split(PATH_SEPARATOR);
  let current = target;

  for (const step of steps.slice(0, -1)) {
    const existing = current[step];
    if (!isPlainObject(existing)) {
      // Si por lo que sea ya hay ahí algo que no es un objeto, se sustituye: la alternativa es perder
      // la rama entera en silencio.
      current[step] = {};
    }
    current = current[step] as Record<string, unknown>;
  }
  current[steps[steps.length - 1]] = value;
}

function parseArray(value: unknown): readonly unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed: unknown = JSON.parse(canonicalText(value));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    // Un JSON roto es un dato del usuario, no un fallo del programa: se contesta `null` y quien
    // pregunta pone la fila en cuarentena.
    return null;
  }
}

/**
 * Replacer de `JSON.stringify` que emite las claves de cada objeto **ordenadas**.
 *
 * Sin esto, dos registros con las mismas líneas en distinto orden de claves —lo que pasa en cuanto un
 * objeto se reconstruye leyendo la hoja— producirían dos cadenas distintas, y por tanto dos huellas
 * distintas: la fila parecería editada a mano en cada ciclo.
 */
function sortedKeys(_key: string, value: unknown): unknown {
  if (!isPlainObject(value)) {
    return value;
  }
  const ordered: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    ordered[key] = value[key];
  }
  return ordered;
}

/** `true` si es un objeto plano — ni `null`, ni array, ni un primitivo. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
