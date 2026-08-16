/**
 * El viaje de un registro entre la base de datos y una celda, y las **cuatro reglas** que lo gobiernan.
 *
 * ## Por qué JSON y no una columna por campo
 *
 * Una celda no tiene tipo. Se escribe con `valueInputOption: RAW`, que guarda tal cual, así que un
 * precio que sube como número vuelve como texto — y lo que baja se guarda **tal cual** en la base de
 * datos. Con `purchasePrice.amount: '4.5'` en vez de `4.5`, el repositorio del recetario descarta ese
 * insumo como documento sin precio y desaparece del catálogo, sin más rastro que un aviso.
 *
 * Hubo una versión de esto que intentaba **adivinar** el tipo de cada columna a partir del valor local
 * para compensarlo. Era un parche sobre un formato que pierde información. Guardando el registro como
 * JSON, el tipo viaja **dentro del dato** y el problema no existe: un número es un número porque el
 * JSON dice que lo es.
 *
 * ## Lo único que se transforma
 *
 * ```
 * registro local ──payloadOf──▶ payload ──canonicalJson──▶ celda
 * celda ──parsePayload──▶ payload ──(+ id de su columna)──▶ lo que ve el motor
 * lo que decidió el motor ──recordFrom──▶ registro local
 * ```
 *
 * Ni se aplana, ni se tipa, ni se reconstruye: lo que hay en la celda es, parseado, exactamente lo que
 * se le pasa al motor. Las únicas dos diferencias entre un registro y su payload están declaradas aquí
 * y son simétricas.
 */

import { LogicalVersion } from '../../domain/services/engine/hybrid-clock';
import { TableRow } from '../../domain/repositories/local.repository';

/**
 * Los campos que **no viajan**, porque su información ya va en una columna de servicio: `updatedAt` en
 * `version` y `deletedAt` en `borrado`.
 *
 * Se quitan **en los dos lados**, y eso es lo que importa. Si el registro local los llevara y el
 * payload remoto no, el motor los vería como campos que solo existen aquí y subiría esa fila en cada
 * ciclo, para siempre. Y si viajaran, dos dispositivos con el **mismo contenido** guardado a distinta
 * hora tendrían huellas distintas: ruido en cada primera sincronización.
 */
const LOCAL_ONLY = ['updatedAt', 'deletedAt'] as const;

/** Lo que viaja de un registro: sus campos de negocio, con su `id`. */
export type Payload = { readonly id: string } & Record<string, unknown>;

/** Un registro, listo para viajar. */
export function payloadOf(record: Readonly<TableRow>): Payload {
  const payload: Record<string, unknown> = { ...record };
  for (const field of LOCAL_ONLY) {
    delete payload[field];
  }
  return payload as Payload;
}

/**
 * Un payload que ganó, listo para guardarse aquí.
 *
 * `updatedAt` se sintetiza del instante que lleva dentro la versión, no de «ahora»: así la fecha que
 * queda guardada es **la del cambio**, y el ciclo siguiente deriva de ella la misma versión que tiene
 * la hoja — que es lo que hace que la fila quede convergida en vez de volver a competir.
 *
 * `deletedAt` solo aparece si la fila viene borrada, y solo si el payload no lo traía ya.
 */
export function recordFrom(
  payload: Payload,
  version: string,
  deleted: boolean,
  now: number,
): TableRow {
  const at = new Date(LogicalVersion.parse(version)?.millis ?? now).toISOString();
  return {
    ...payload,
    updatedAt: at,
    ...(deleted ? { deletedAt: at } : {}),
  } as TableRow;
}

/**
 * El JSON con el que se escribe la celda, y sobre el que se calcula la huella.
 *
 * **Canónico**, y de eso depende que la huella siga significando «esto lo escribí yo»:
 *
 * - **Claves ordenadas** en todos los niveles. Un objeto que vuelve de un `JSON.parse` no conserva el
 *   orden en que se escribió, así que sin ordenar el mismo dato daría dos cadenas distintas según de
 *   dónde viniera, y la fila parecería editada a mano en cada ciclo.
 * - **Textos en NFC.** Un acento tiene dos codificaciones posibles y no siempre vuelve como se mandó;
 *   sin normalizar, cualquier nombre acentuado sería una edición manual permanente.
 * - **Sin nulos.** Un campo ausente y uno a `null` son lo mismo para el destino, y tenerlos como dos
 *   cosas distintas haría divergir a dos dispositivos que guardan lo mismo.
 * - **Sin espacios.** Lo que se escribe en la celda **es** lo que se hashea; formatearlo bonito
 *   añadiría una diferencia entre lo escrito y lo medido.
 */
export function canonicalJson(payload: Readonly<Payload>): string {
  return JSON.stringify(payload, canonical);
}

/**
 * El payload que hay escrito en una celda. `null` —nunca lanza— si no se puede leer.
 *
 * Una celda que alguien estropeó no puede parar la sincronización de todo lo demás, y como seguiría en
 * la hoja, la pararía **para siempre**. Quien pregunta pone esa fila en cuarentena y sigue con el resto.
 */
export function parsePayload(cell: unknown): Payload | null {
  if (typeof cell !== 'string' || cell.trim().length === 0) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(cell);
    return isPlainObject(parsed) ? (parsed as Payload) : null;
  } catch {
    return null;
  }
}

/** Replacer de `JSON.stringify`: ordena claves, normaliza textos y quita los nulos. */
function canonical(_key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    return value.normalize('NFC');
  }
  if (value === null) {
    return undefined;
  }
  if (!isPlainObject(value)) {
    return value;
  }

  const ordered: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const child = value[key];
    if (child !== null && child !== undefined) {
      ordered[key] = child;
    }
  }
  return ordered;
}

/** `true` si es un objeto plano — ni `null`, ni array, ni un primitivo. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
