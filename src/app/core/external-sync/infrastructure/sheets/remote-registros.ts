/**
 * La traducción entre **una pestaña de una hoja** y las dos listas que el motor sabe reconciliar.
 *
 * El motor decide sobre registros con id, huella, borrado y versión. Una hoja de cálculo no es eso:
 * es una cuadrícula que una persona puede editar, en la que se puede teclear una fila nueva sin id,
 * cambiarle el id a otra, borrar una entera o escribir una fecha imposible en la columna de versión.
 * **Todo eso se resuelve aquí**, antes de que el motor vea nada, porque el motor no sabe —ni tiene que
 * saber— qué es una hoja.
 *
 * Lo que **no** pasa aquí es ninguna transformación del dato. La celda `datos` lleva el registro en
 * JSON, así que basta con parsearlo: lo que hay escrito es, literalmente, lo que se le pasa al motor.
 * Antes había que aplanarlo a columnas, adivinar el tipo de cada una y volver a montarlo — y de ahí
 * salió el fallo que dejó el catálogo de insumos vacío.
 *
 * ## Las cinco cosas que hace una persona, y cómo se detecta cada una
 *
 * | Lo que hizo | Cómo se sabe | Qué se hace |
 * |---|---|---|
 * | Editó el JSON | la huella escrita no cuadra con la del contenido | se le da versión de **ahora**: gana |
 * | Borró la fila entera | su id está en el shadow y ya no está en la hoja | lápida incondicional: el destino manda |
 * | Tecleó una fila sin id | la fila tiene datos y la celda del id está vacía | se **adopta**: id nuevo, y se le estampa de vuelta |
 * | Le cambió el id a una fila | su contenido sin id coincide con el de una fila local que ya no está en la hoja | se le **devuelve** el suyo |
 * | Escribió una versión imposible | la fecha viene del futuro | se re-estampa (lo hace el motor) |
 *
 * ## Por qué la huella vacía significa «adoptar» y no «editada a mano»
 *
 * Una fila **sin huella** es una fila que este motor nunca escribió: o la hoja es anterior a que
 * existiera la columna, o la acaba de teclear alguien. Si se tratara como edición manual, el primer
 * ciclo contra una hoja que ya existía vería *todas* las filas sin huella, les pondría versión nueva a
 * todas, y a la vez las vería como cambios locales porque el shadow está vacío: el catálogo entero
 * colisionaría en el mismo ciclo y se resolvería por desempate de dispositivo, o sea **al azar**.
 *
 * Se adoptan: se toma su versión si la traen y se deja que la comparación normal decida.
 */

import { TableRow } from '../../domain/repositories/local.repository';
import { RawRow, RemoteRow, RemoteTable } from '../../domain/repositories/remote.repository';
import { Registro } from '../../domain/services/engine/engine.types';
import { LogicalVersion } from '../../domain/services/engine/hybrid-clock';
import { ShadowRow } from '../../domain/services/sync-shadow';
import { canonicalCode, canonicalText } from '../sheet-canonical';
import { fingerprintOf } from '../sheet-hash';
import { ID_COLUMN, SHEET_HEADERS } from '../sheet-schema';
import { canonicalJson, Payload, payloadOf } from './record-json';

/** Cuánto vive una lápida antes de tirarse de la hoja. */
export const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** Una fila que alguien tecleó sin id: hay que devolverle su identidad a su propia fila. */
export interface HandAdd {
  readonly index: number;
  readonly id: string;
  readonly fingerprint: string;
  readonly version: string;
}

/** Una fila a la que alguien le cambió el id. Se le devuelve el suyo, en su sitio. */
export interface Reid {
  readonly index: number;
  readonly id: string;
  readonly previous: string;
}

export interface TranslatedTable {
  readonly table: string;
  /** Lo que hay en el destino, en la forma que el motor entiende. */
  readonly base: readonly Registro[];
  /** Lo que hay aquí, en la misma forma. */
  readonly data: readonly Registro[];
  /** Dónde está cada fila del destino, por id. Para escribir sin moverla. */
  readonly positions: ReadonlyMap<string, number>;
  /** El contenido crudo de la pestaña, para poder reescribirla conservando lo ajeno. */
  readonly existing: readonly RawRow[];
  readonly handAdds: readonly HandAdd[];
  readonly reids: readonly Reid[];
  /** Lápidas lo bastante viejas como para tirarlas. */
  readonly purge: readonly number[];
  /**
   * Cuántas filas ha borrado **una persona** en la hoja (estaban en el shadow y ya no están).
   *
   * Se cuentan aparte de las lápidas normales porque son las únicas que puede haber provocado un
   * accidente —una lectura a medias, un `Ctrl+Z` desafortunado— y son las que mira la barrera de
   * borrado masivo. Un borrado hecho desde la app llega con su lápida y no cuenta aquí.
   */
  readonly handDeletes: number;
  /** Por qué esta tabla no se puede tocar este ciclo. `null` = se puede. */
  readonly barrier: string | null;
}

export interface TranslateInput {
  readonly remote: RemoteTable;
  readonly local: readonly TableRow[];
  readonly shadow: readonly ShadowRow[];
  readonly now: number;
  readonly deviceId: string;
  readonly newIdentity: () => string;
}

/**
 * Traduce una pestaña y sus filas locales a lo que el motor necesita.
 *
 * Es `async` por una sola razón: la huella se calcula con `crypto.subtle`, que lo es. Nada aquí toca
 * la red ni la base de datos.
 */
export async function translateTable(input: TranslateInput): Promise<TranslatedTable> {
  const { remote, local, shadow, now, deviceId } = input;

  const barrier = barrierFor(remote, shadow);
  if (barrier !== null) {
    return empty(remote.table, barrier);
  }

  const localIds = new Set(local.map((row) => canonicalCode(row.id)));

  /*
   * Los ids que la hoja contiene, mirados ANTES de interpretar nada. Sirven para dos cosas, y las dos
   * son la diferencia entre corregir la hoja y destrozarla:
   *
   * 1. Una fila **ilegible** cuenta como presente. No entra en la decisión —no se puede leer— pero
   *    está ahí, y si no se contara, el shadow la daría por desaparecida y sintetizaría su lápida: una
   *    celda que alguien estropeó borraría el dato en todos los dispositivos, y como la celda seguiría
   *    en la hoja, lo borraría otra vez en cada ciclo.
   * 2. Una fila local solo es candidata a «le cambiaron el id» si **su id ya no está en la hoja**. Sin
   *    esa comprobación, cualquier fila remota con un id que este dispositivo no conozca podía robarle
   *    la identidad a una fila local que seguía ahí, con su id, tan tranquila.
   */
  const idsInSheet = new Set<string>(
    [
      ...remote.rows.map((row) => canonicalText(row.values[ID_COLUMN])),
      ...remote.unreadable.map((row) => canonicalText(row.id)),
    ]
      .filter((id) => id.length > 0)
      .map((id) => canonicalCode(id)),
  );

  const remoteIds = new Set<string>(
    remote.unreadable.map((row) => canonicalCode(row.id)).filter((id) => id.length > 0),
  );
  const positions = new Map<string, number>();
  const base: Registro[] = [];
  const handAdds: HandAdd[] = [];
  const reids: Reid[] = [];
  const purge: number[] = [];
  let handDeletes = 0;

  // Las filas locales que la hoja ya no menciona son las candidatas a «alguien le cambió el id»: se
  // compara su contenido SIN el id, que es lo único que sobrevive a ese cambio.
  const identityless = await identitylessIndex(local, idsInSheet);

  for (const row of remote.rows) {
    const payload = row.values as Payload;
    const fingerprint = await fingerprintOf([canonicalJson(payload)]);

    const id = canonicalText(payload[ID_COLUMN]);
    if (id.length === 0) {
      const adopted = await adopt(input, row, payload);
      base.push(adopted.registro);
      handAdds.push(adopted.handAdd);
      remoteIds.add(canonicalCode(adopted.handAdd.id));
      positions.set(canonicalCode(adopted.handAdd.id), row.index);
      continue;
    }

    const key = canonicalCode(id);
    const previous = localIds.has(key) ? null : identityless.get(await identitylessOf(payload));
    const resolved = previous ?? id;

    if (previous !== null && previous !== undefined) {
      reids.push({ index: row.index, id: previous, previous: id });
    }

    remoteIds.add(canonicalCode(resolved));
    positions.set(canonicalCode(resolved), row.index);
    base.push(registroFrom(resolved, row, payload, fingerprint, now, deviceId));

    if (row.meta.deleted && isOldTombstone(row.meta.version, now)) {
      purge.push(row.index);
    }
  }

  // Lo que el shadow recuerda y la hoja ya no tiene: alguien borró esa fila a mano. El motor no
  // deduce un borrado de una ausencia —y hace bien, porque «no está» también es «nunca llegó»—, así
  // que la lápida se sintetiza aquí, que es el único sitio que sabe lo que había antes.
  for (const remembered of shadow) {
    if (remoteIds.has(canonicalCode(remembered.rowId))) {
      continue;
    }
    base.push(tombstone(remembered, now, deviceId));
    if (!remembered.deleted) {
      // Solo cuenta como borrado a mano lo que estaba VIVO la última vez que se vio: una lápida que
      // se purgó de la hoja por vieja no es nadie borrando nada.
      handDeletes += 1;
    }
  }

  const data = await Promise.all(
    local.map((row) => localRegistro(row, shadowOf(shadow, row.id), deviceId)),
  );

  return {
    table: remote.table,
    base,
    data,
    positions,
    existing: remote.raw,
    handAdds,
    reids,
    purge,
    handDeletes,
    barrier: null,
  };
}

/**
 * Por qué una tabla no se puede tocar. Dos barreras, y las dos existen porque el coste de equivocarse
 * es borrar datos en todos los dispositivos a la vez.
 *
 * **La pestaña no está** y el shadow la conocía. «No hay filas» combinado con «lo que estaba y ya no
 * está, se borró» borra la tabla entera. Un clic derecho en «Eliminar hoja» no puede costar eso. Una
 * pestaña que nunca ha existido —una hoja recién creada, una tabla recién añadida al array— no la ha
 * borrado nadie: la crea la primera escritura.
 *
 * **La cabecera no es la nuestra.** Con un esquema fijo esto es una comparación directa, y sustituye a
 * la barrera anterior —que miraba, columna a columna, si el shadow recordaba alguna que ya no
 * estuviera— por algo más simple y que no depende de lo que se recuerde. Una pestaña sin cabecera
 * todavía no cuenta: la escribe la primera escritura.
 */
function barrierFor(remote: RemoteTable, shadow: readonly ShadowRow[]): string | null {
  if (!remote.present) {
    return shadow.length > 0 ? `falta la pestaña «${remote.table}»` : null;
  }

  const written = remote.header.filter((column) => column.length > 0);
  if (written.length === 0) {
    return null;
  }
  const expected = SHEET_HEADERS.join(' · ');
  return written.join(' · ') === expected
    ? null
    : `la cabecera de «${remote.table}» no es la que escribe la sincronización (${expected})`;
}

function empty(table: string, barrier: string): TranslatedTable {
  return {
    table,
    base: [],
    data: [],
    positions: new Map(),
    existing: [],
    handAdds: [],
    reids: [],
    purge: [],
    handDeletes: 0,
    barrier,
  };
}

/**
 * Un registro del destino, con la versión que le toca.
 *
 * Aquí está la detección de edición manual, que es lo que hace que la hoja sea de verdad la fuente de
 * la verdad: la app escribe **siempre** el contenido y su huella juntos, así que si al recalcularla no
 * coincide, esa fila la tocó una persona. Y una persona que corrige un dato no actualiza la columna de
 * versión — sin esto, la resolución por versión pisaría su corrección.
 *
 * La huella se calcula sobre el JSON **canónico**, no sobre el texto de la celda: así reformatear el
 * JSON o reordenar sus claves no cuenta como edición, pero cambiar un valor sí.
 */
function registroFrom(
  id: string,
  row: RemoteRow,
  payload: Payload,
  fingerprint: string,
  now: number,
  deviceId: string,
): Registro {
  const written = row.meta.fingerprint;
  const adopted = written.length === 0;
  const handEdited = !adopted && written.toLowerCase() !== fingerprint;

  return {
    ...payload,
    [ID_COLUMN]: id,
    sync: {
      id: ID_COLUMN,
      keyfinder: fingerprint,
      deleted: row.meta.deleted,
      createdAt: handEdited
        ? LogicalVersion.of(now, 0, deviceId).toString()
        : canonicalText(row.meta.version),
    },
  } as Registro;
}

/**
 * Una fila que alguien tecleó a mano: se le da identidad y se apunta que hay que estampársela **en su
 * propia fila**, sin moverla — la puso ahí quien la escribió.
 *
 * Sin el estampado de vuelta, el ciclo siguiente volvería a verla sin id y le inventaría otra
 * identidad: un agregado nuevo cada dos minutos, para siempre.
 *
 * La huella que se estampa es la del contenido **con el id ya puesto**, que es lo que quedará escrito.
 * Estampar la de antes haría que el ciclo siguiente viera que no cuadra y diera la fila por editada a
 * mano — con versión nueva, ganándole a cualquier cambio legítimo de otro dispositivo.
 */
async function adopt(
  input: TranslateInput,
  row: RemoteRow,
  payload: Payload,
): Promise<{ registro: Registro; handAdd: HandAdd }> {
  const id = input.newIdentity();
  const version = LogicalVersion.of(input.now, 0, input.deviceId).toString();
  const withId = { ...payload, [ID_COLUMN]: id };
  const fingerprint = await fingerprintOf([canonicalJson(withId)]);

  return {
    registro: {
      ...withId,
      sync: {
        id: ID_COLUMN,
        keyfinder: fingerprint,
        deleted: row.meta.deleted,
        createdAt: version,
      },
    } as Registro,
    handAdd: { index: row.index, id, fingerprint, version },
  };
}

/** La lápida de una fila que estaba y ya no está. El borrado del destino no se discute. */
function tombstone(remembered: ShadowRow, now: number, deviceId: string): Registro {
  return {
    ...(remembered.values ?? {}),
    [ID_COLUMN]: remembered.rowId,
    sync: {
      id: ID_COLUMN,
      keyfinder: remembered.fingerprint ?? '',
      deleted: true,
      createdAt: LogicalVersion.of(now, 0, deviceId).toString(),
    },
  } as Registro;
}

/**
 * Un registro de aquí, en la misma forma en que viaja: **sin** su fecha de guardado ni su lápida.
 *
 * Se quitan porque no viajan (ver `record-json.ts`), y quitarlas **en los dos lados** es lo que evita
 * que el motor las vea como campos que solo existen aquí y suba esa fila en cada ciclo.
 *
 * Su versión sale de la fecha de guardado del propio documento, que es lo único que este lado sabe de
 * cuándo cambió. Sin ella el motor decide a ciegas y gana el destino — que es lo prudente, pero pierde
 * una edición local legítima, así que se aprovecha siempre que se pueda leer.
 *
 * Y el ancestro (`syncedValues`) es lo que el shadow recuerda de la última vez que los dos lados
 * coincidieron: sin él no se puede fusionar campo a campo y gana un lado entero.
 */
async function localRegistro(
  row: TableRow,
  remembered: ShadowRow | undefined,
  deviceId: string,
): Promise<Registro> {
  const payload = payloadOf(row);
  const fingerprint = await fingerprintOf([canonicalJson(payload)]);
  const changedAt = Date.parse(canonicalText(row['updatedAt']));

  return {
    ...payload,
    sync: {
      id: ID_COLUMN,
      keyfinder: fingerprint,
      deleted: canonicalText(row['deletedAt']).length > 0,
      createdAt: Number.isFinite(changedAt)
        ? LogicalVersion.of(changedAt, 0, deviceId).toString()
        : '',
      ...(remembered?.values ? { syncedValues: remembered.values } : {}),
    },
  } as Registro;
}

function shadowOf(shadow: readonly ShadowRow[], id: string): ShadowRow | undefined {
  const key = canonicalCode(id);
  return shadow.find((row) => canonicalCode(row.rowId) === key);
}

/**
 * El índice de «contenido sin id» → id, de las filas locales que **ya no están en la hoja**.
 *
 * Es lo que reconoce que a una fila le cambiaron el id: el id es lo único que cambió, así que
 * comparando lo demás se sabe cuál era. Es el desenlace más silencioso de todos si no se corrige — el
 * id viejo desaparece (se daría por borrado el agregado), el nuevo parece un alta, y todo lo que
 * apuntaba al viejo queda colgando mientras la hoja parece perfecta.
 *
 * **La condición de ausencia no es opcional.** Que a una fila le cambiaran el id significa que su id
 * viejo ya no aparece en la hoja; si sigue apareciendo, no le cambiaron nada y esta otra fila es otra
 * cosa. Sin la comprobación, cualquier fila remota con un id desconocido para este dispositivo —todas
 * las de la hoja, la primera vez que se sincroniza— podía robarle la identidad a una fila local que
 * seguía en su sitio, y entonces el id robado desaparecía de la hoja y el ciclo siguiente lo daba por
 * borrado. Un renombre de identidad no puede salir de una coincidencia de contenido a secas.
 */
async function identitylessIndex(
  local: readonly TableRow[],
  idsInSheet: ReadonlySet<string>,
): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  for (const row of local) {
    if (idsInSheet.has(canonicalCode(row.id))) {
      continue;
    }
    index.set(await identitylessOf(payloadOf(row)), row.id);
  }
  return index;
}

async function identitylessOf(payload: Payload): Promise<string> {
  return fingerprintOf([canonicalJson({ ...payload, [ID_COLUMN]: '' })]);
}

/** `true` si una lápida es lo bastante vieja como para tirarla de la hoja. */
function isOldTombstone(version: string, now: number): boolean {
  const parsed = LogicalVersion.parse(version);
  return parsed !== null && parsed.millis < now - TOMBSTONE_TTL_MS;
}
