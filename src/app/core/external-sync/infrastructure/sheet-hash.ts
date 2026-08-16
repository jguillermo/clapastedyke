/**
 * La huella de una fila: lo que distingue «esta fila la escribió la app» de «esta fila la tocó una
 * persona».
 *
 * ## Para qué sirve
 *
 * La app escribe **siempre** el contenido y su huella juntos, en la misma petición. Así que al leer,
 * si se recalcula la huella del contenido y **no** coincide con la que hay en la celda, solo puede
 * haber pasado una cosa: alguien editó la fila a mano en la hoja. Es la única forma de detectarlo,
 * porque una persona que corrige un precio no actualiza la columna de versión — y sin esta
 * comprobación, la resolución por versión pisaría su corrección sin dejar rastro.
 *
 * ## Por qué SHA-256 y no algo más corto
 *
 * `crypto.subtle` está en todo navegador y no añade ninguna dependencia. Un hash artesanal más corto
 * (32 bits, por decir) tendría colisiones a los pocos miles de filas, y una colisión aquí significa
 * **no detectar una edición manual**: se perdería el cambio de esa persona en silencio, que es
 * exactamente lo que esta pieza existe para evitar.
 *
 * ## Esto no se «mejora» nunca
 *
 * Cambiar cómo se calcula —el algoritmo, el separador, el número de caracteres— hace que **todas** las
 * huellas escritas dejen de coincidir, así que en el siguiente ciclo *cada fila de cada dispositivo*
 * parecerá editada a mano a la vez. Si algún día hiciera falta, se hace como un cambio de versión de
 * esquema con su paso de adopción, no editando esta función.
 */

/**
 * Separador entre columnas: el «unit separator» de ASCII, el carácter 31.
 *
 * Se construye con `fromCharCode` y no como carácter literal a propósito: un carácter de control es
 * **invisible** en el fuente, y un separador que nadie ve es un separador que cualquiera borra sin
 * enterarse. Así se lee cuál es sin depender de cómo lo pinte el editor.
 *
 * Tiene que ser algo que **no se pueda teclear en una celda**. Con un separador imprimible —un
 * espacio, una barra— dos filas distintas darían la misma huella: `['a', 'b']` y `['a b']` se unirían
 * en la misma cadena, y una edición manual que moviera texto de una columna a la de al lado pasaría
 * por «aquí no ha cambiado nada».
 */
const SEPARATOR = String.fromCharCode(31);

/**
 * Cuántos caracteres hexadecimales de los 64 se guardan. 16 son 64 bits: con un recetario de miles de
 * filas la probabilidad de colisión es despreciable, y la celda no se come media pantalla de la hoja
 * que el usuario tiene delante.
 */
const LENGTH = 16;

/**
 * La huella de unos valores **ya canonizados** (ver `sheet-canonical.ts`). Recibe lo canónico y no los
 * valores crudos a propósito: si esta función canonizara por su cuenta habría dos sitios haciéndolo, y
 * el día que discreparan el motor entraría en bucle.
 */
export async function fingerprintOf(values: readonly string[]): Promise<string> {
  const source = values.join(SEPARATOR);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return hex(digest).slice(0, LENGTH);
}

/**
 * `true` si el contenido cuadra con la huella escrita.
 *
 * Una huella **vacía o ilegible cuenta como que no cuadra**, y es deliberado: una fila sin huella es
 * una fila de la que no se sabe quién la escribió, y lo prudente es tratarla como editada a mano
 * —respetar lo que dice la hoja— en vez de asumir que es nuestra y sobrescribirla.
 */
export function fingerprintMatches(written: string, computed: string): boolean {
  return written.trim().toLowerCase() === computed;
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
