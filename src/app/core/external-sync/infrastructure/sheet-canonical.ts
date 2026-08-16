/**
 * Cómo se leen las **celdas de servicio** de la hoja: el id con el que se emparejan las filas y la
 * lápida.
 *
 * ## Lo que este fichero ya no hace
 *
 * Aquí vivía la canonización de cada valor del usuario —números, banderas, códigos— porque cada campo
 * ocupaba su propia celda y una celda no tiene tipo: un precio subía como número y volvía como texto,
 * así que había que reducir los dos a la misma cadena para poder compararlos. Aquello costó un fallo
 * caro (los insumos desaparecían del catálogo) y una capa entera dedicada a adivinar el tipo de cada
 * columna a partir del valor local.
 *
 * Con el registro guardado como **JSON** el tipo viaja dentro del dato y esa canonización sobra: un
 * número es un número porque el JSON lo dice. Lo único que queda aquí es la forma canónica del
 * **texto**, porque las celdas de servicio sí lo son y porque el `id` se empareja sin distinguir
 * mayúsculas. La canonización del contenido —ordenar claves, normalizar, quitar nulos— vive ahora en
 * `sheets/record-json.ts`.
 */

/** Un valor tal y como puede llegar de una celda: texto, número, booleano, o nada. */
export type RawValue = unknown;

/** Lo que la app escribe en una celda de sí/no. Al leer se es más estricto: ver `isTombstone`. */
export const FLAG_TRUE = 'TRUE';

/** Lo que se reconoce como un «no» explícito. */
const FLAG_FALSE_VALUES = new Set(['', 'false', 'no', '0', 'n', 'falso']);

/**
 * Texto: se recorta y se normaliza en NFC.
 *
 * El NFC no es cosmético: «á» se puede codificar de dos maneras y no siempre vuelve como se mandó.
 * Sin normalizar, cualquier valor acentuado sería una edición a mano permanente.
 */
export function canonicalText(value: RawValue): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().normalize('NFC');
}

/**
 * Como `canonicalText`, sin mayúsculas: es la forma en que se **emparejan los ids**.
 *
 * Sin esto, un id al que alguien le cambió una letra a mayúscula en la hoja dejaría de reconocerse
 * como el suyo y la fila se duplicaría en cada escritura.
 */
export function canonicalCode(value: RawValue): string {
  return canonicalText(value).toLowerCase();
}

/**
 * Las marcas que cuentan como «esta fila está borrada». Cerrada a propósito.
 *
 * Para un sí/no cualquiera conviene ser permisivo —una persona escribe `Sí`, una `x`, o marca una
 * casilla—, pero para la **lápida** no vale, porque el daño es asimétrico. Un falso «no borrado» no se
 * nota: la fila sigue ahí y alguien la vuelve a borrar. Un falso «borrado» **hace desaparecer el dato
 * en todos los dispositivos a la vez**, y para cuando alguien se da cuenta, la lápida ya viajó.
 *
 * Basta con que una celda de servicio quede descolocada —una escritura que se corrió un sitio— para
 * que ahí acabe una huella, y una huella no está en la lista de «noes». Así que se invierte la carga:
 * solo borra lo que se reconoce como una orden de borrar; **cualquier otra cosa se lee como viva**.
 */
const TOMBSTONE_MARKS = new Set(['true', 'sí', 'si', 'x', '1', 'verdadero', 'yes']);

/**
 * `true` si la celda dice, sin ambigüedad, que la fila está borrada.
 *
 * Sigue valiendo lo que teclea una persona; lo que ya no vale es lo que no se entiende.
 */
export function isTombstone(value: RawValue): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return TOMBSTONE_MARKS.has(canonicalText(value).toLowerCase());
}

/** `true` si la celda tiene algo escrito que no se entiende como un sí ni como un no. */
export function isUnrecognisedTombstone(value: RawValue): boolean {
  const text = canonicalText(value).toLowerCase();
  return text.length > 0 && !TOMBSTONE_MARKS.has(text) && !FLAG_FALSE_VALUES.has(text);
}
